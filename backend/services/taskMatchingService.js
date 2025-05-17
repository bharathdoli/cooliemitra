import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import Worker from '../models/Worker.js';
import Task from '../models/Task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to calculate skill match score
const calculateSkillMatch = (workerSkills, requiredSkills) => {
  let matchScore = 0;
  const totalRequiredSkills = requiredSkills.length;

  for (const requiredSkill of requiredSkills) {
    const workerSkill = workerSkills.find(s => s.name === requiredSkill.name);
    if (workerSkill) {
      // Base score for having the skill
      let skillScore = 1;

      // Bonus for experience level
      const levelScores = { beginner: 0.5, intermediate: 0.8, expert: 1 };
      skillScore += levelScores[workerSkill.level] || 0;

      // Bonus for years of experience
      skillScore += Math.min(workerSkill.yearsOfExperience / 5, 1);

      // Bonus for required certifications
      const hasRequiredCerts = requiredSkill.requiredCertifications.every(cert =>
        workerSkill.certifications.includes(cert)
      );
      if (hasRequiredCerts) skillScore += 0.5;

      matchScore += skillScore;
    }
  }

  return matchScore / totalRequiredSkills;
};

// Helper function to calculate availability match
const calculateAvailabilityMatch = (worker, task) => {
  const taskDate = new Date(task.deadline);
  const dayOfWeek = taskDate.toLocaleLowerCase();
  
  if (!worker.availability[dayOfWeek]) return 0;

  const taskTime = taskDate.getHours() + taskDate.getMinutes() / 60;
  const [workerStart, workerEnd] = worker.workingHours.start.split(':').map(Number);
  const workerStartTime = workerStart + workerEnd / 60;

  if (taskTime >= workerStartTime && taskTime <= worker.workingHours.end) {
    return 1;
  }
  return 0.5; // Partial match if outside working hours
};

// Helper function to calculate performance score
const calculatePerformanceScore = (worker) => {
  if (!worker.workHistory || worker.workHistory.length === 0) return 0.5;

  const completedTasks = worker.workHistory.filter(session => session.endTime);
  if (completedTasks.length === 0) return 0.5;

  const totalRating = completedTasks.reduce((sum, task) => sum + (task.performanceRating || 3), 0);
  return totalRating / completedTasks.length / 5; // Normalize to 0-1
};

export const findBestWorkerForTask = async (taskId) => {
  try {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');

    const availableWorkers = await Worker.find({
      status: 'accepted',
      'workHistory.endTime': { $exists: true } // Has completed at least one task
    });

    const workerScores = await Promise.all(availableWorkers.map(async (worker) => {
      const skillMatch = calculateSkillMatch(worker.skills, task.requiredSkills);
      const availabilityMatch = calculateAvailabilityMatch(worker, task);
      const performanceScore = calculatePerformanceScore(worker);

      // Weighted scoring
      const totalScore = (
        skillMatch * 0.5 +
        availabilityMatch * 0.3 +
        performanceScore * 0.2
      );

      return {
        workerId: worker._id,
        score: totalScore,
        details: {
          skillMatch,
          availabilityMatch,
          performanceScore
        }
      };
    }));

    // Sort by score in descending order
    workerScores.sort((a, b) => b.score - a.score);

    return workerScores[0]; // Return the best match
  } catch (error) {
    console.error('Error in findBestWorkerForTask:', error);
    throw error;
  }
};

export const assignTaskToWorker = async (taskId, workerId) => {
  try {
    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        assignedWorker: workerId,
        status: 'assigned'
      },
      { new: true }
    );

    if (!task) throw new Error('Task not found');

    return task;
  } catch (error) {
    console.error('Error in assignTaskToWorker:', error);
    throw error;
  }
}; 