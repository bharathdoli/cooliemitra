import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Worker from '../models/Worker.js';
import Task from '../models/Task.js';
import { predictWorkHours } from '../services/mlService.js';
import { findBestWorkerForTask, assignTaskToWorker } from '../services/taskMatchingService.js';

const router = express.Router();

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

/**
 * @route   POST /api/workers/register
 * @desc    Register new worker
 */
router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const {
      name,
      phone,
      username,
      password,
      skills,
      preferredTaskTypes,
      availability,
      workingHours
    } = req.body;

    if (!name || !phone || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await Worker.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const parsedSkills = JSON.parse(skills);
    if (!Array.isArray(parsedSkills) || parsedSkills.some(skill => !skill.name)) {
      return res.status(400).json({ error: 'Each skill must have a name' });
    }

    const newWorker = new Worker({
      name,
      phone,
      username,
      password,
      skills: parsedSkills,
      preferredTaskTypes: JSON.parse(preferredTaskTypes),
      availability: JSON.parse(availability),
      workingHours: JSON.parse(workingHours),
      photo: req.file ? req.file.path : null,
      isPaid: false,
      status: 'pending',
      workHistory: [],
    });

    const saved = await newWorker.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Register worker error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to register worker: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/login
 * @desc    Login worker
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const worker = await Worker.findOne({ username, password });
    if (!worker) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', worker });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).json({ error: `Server error during login: ${err.message}` });
  }
});

/**
 * @route   GET /api/workers/getWorker
 * @desc    Get all workers
 */
router.get('/getWorker', async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const workers = await Worker.find(query);
    res.json(workers);
  } catch (err) {
    console.error('Get workers error:', err.message, err.stack);
    res.status(500).json({ error: `Error fetching workers: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/:id/accept
 * @desc    Accept a worker
 */
router.post('/:id/accept', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    );
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    console.error('Accept worker error:', err.message, err.stack);
    res.status(500).json({ error: `Error accepting worker: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/:id/reject
 * @desc    Reject a worker
 */
router.post('/:id/reject', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json(worker);
  } catch (err) {
    console.error('Reject worker error:', err.message, err.stack);
    res.status(500).json({ error: `Error rejecting worker: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/start-session
 * @desc    Start work session
 */
router.post('/start-session', async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const ongoingSession = worker.workHistory.find(s => !s.endTime);
    if (ongoingSession) {
      return res.status(400).json({ error: 'Worker already has an active session' });
    }

    const session = {
      startTime: new Date(),
      breaks: [],
    };

    worker.workHistory.push(session);
    await worker.save({ validateModifiedOnly: true });
    console.log('Work session started for worker:', workerId);
    res.json(session);
  } catch (err) {
    console.error('Start session error:', err.message, err.stack);
    res.status(500).json({ error: `Error starting work session: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/stop-session
 * @desc    Stop work session
 */
router.post('/stop-session', async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const ongoingSession = worker.workHistory.find(s => !s.endTime);
    if (!ongoingSession) {
      return res.status(400).json({ error: 'No active session to stop' });
    }

    ongoingSession.endTime = new Date();
    await worker.save({ validateModifiedOnly: true });
    console.log('Work session stopped for worker:', workerId);
    res.json(ongoingSession);
  } catch (err) {
    console.error('Stop session error:', err.message, err.stack);
    res.status(500).json({ error: `Error stopping work session: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/start-break
 * @desc    Start a break
 */
router.post('/start-break', async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    const ongoingSession = worker.workHistory.find((session) => !session.endTime);
    if (!ongoingSession) {
      return res.status(400).json({ error: 'No active session' });
    }
    const ongoingBreak = ongoingSession.breaks.find((b) => !b.end);
    if (ongoingBreak) {
      return res.status(400).json({ error: 'Break already active' });
    }
    const newBreak = { start: new Date() };
    ongoingSession.breaks.push(newBreak);
    await worker.save({ validateModifiedOnly: true });
    console.log('Break started for worker:', workerId);
    res.json(newBreak);
  } catch (err) {
    console.error('Start break error:', err.message, err.stack);
    res.status(500).json({ error: `Error starting break: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/end-break
 * @desc    End a break
 */
router.post('/end-break', async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    const ongoingSession = worker.workHistory.find((session) => !session.endTime);
    if (!ongoingSession) {
      return res.status(400).json({ error: 'No active session' });
    }
    const ongoingBreak = ongoingSession.breaks.find((b) => !b.end);
    if (!ongoingBreak) {
      return res.status(400).json({ error: 'No active break' });
    }
    ongoingBreak.end = new Date();
    await worker.save({ validateModifiedOnly: true });
    console.log('Break ended for worker:', workerId);
    res.json(ongoingBreak);
  } catch (err) {
    console.error('End break error:', err.message, err.stack);
    res.status(500).json({ error: `Error ending break: ${err.message}` });
  }
});

/**
 * @route   GET /api/workers/:id
 * @desc    Get single worker
 */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json(worker);
  } catch (err) {
    console.error('Get worker error:', err.message, err.stack);
    res.status(500).json({ error: `Error fetching worker: ${err.message}` });
  }
});

/**
 * @route   GET /api/workers/:id/predict-hours
 * @desc    Predict hours for next session
 */
router.get('/:id/predict-hours', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    const prediction = await predictWorkHours(worker.toObject());
    res.json({ predictedHours: prediction });
  } catch (err) {
    console.error('Prediction error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to predict hours: ${err.message}` });
  }
});

/**
 * @route   GET /api/workers/:id/tasks
 * @desc    Get recommended tasks for a worker
 */
router.get('/:id/tasks', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Get worker's profession from their skills
    const workerProfession = worker.skills[0]?.name || '';
    
    // Find tasks that match the worker's profession
    const allTasks = await Task.find({ 
      status: 'open',
      'requiredSkills.name': workerProfession 
    });

    const tasks = allTasks.filter(task => {
      const taskSkillNames = task.requiredSkills.map(s => s.name);
      return taskSkillNames.some(skill => worker.skills.map(s => s.name).includes(skill));
    });

    const scoredTasks = tasks.map(task => {
      const skillMatch = calculateSkillMatch(worker.skills, task.requiredSkills);
      const availabilityMatch = calculateAvailabilityMatch(worker, task);
      const performanceScore = calculatePerformanceScore(worker);

      const totalScore = (
        skillMatch * 0.5 +
        availabilityMatch * 0.3 +
        performanceScore * 0.2
      );

      return {
        task,
        matchScore: totalScore,
        matchDetails: {
          skillMatch,
          availabilityMatch,
          performanceScore
        }
      };
    });

    scoredTasks.sort((a, b) => b.matchScore - a.matchScore);
    console.log('Returning scored tasks:', scoredTasks.length);
    res.json(scoredTasks);
  } catch (err) {
    console.error('Tasks fetch error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch recommended tasks: ${err.message}` });
  }
});

/**
 * @route   GET /api/workers/:id/active-tasks
 * @desc    Get active tasks for a worker
 */
router.get('/:id/active-tasks', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid worker ID' });
    }
    const workerId = req.params.id;
    const tasks = await Task.find({
      assignedWorker: workerId,
      status: 'assigned'
    });
    console.log(`Fetched ${tasks.length} active tasks for worker:`, workerId);
    res.json(tasks);
  } catch (err) {
    console.error('Active tasks fetch error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch active tasks: ${err.message}` });
  }
});

/**
 * @route   POST /api/workers/:id/accept-task/:taskId
 * @desc    Accept a task
 */
router.post('/:id/accept-task/:taskId', async (req, res) => {
  try {
    const { id, taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: 'Invalid worker or task ID' });
    }

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ error: 'Task is not available for acceptance' });
    }

    task.status = 'assigned';
    task.assignedWorker = id;
    await task.save();

    console.log(`Task ${taskId} assigned to worker ${id}`);
    res.json(task);
  } catch (err) {
    console.error('Accept task error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to accept task: ${err.message}` });
  }
});

// Helper functions
const calculateSkillMatch = (workerSkills, requiredSkills) => {
  let matchScore = 0;
  const totalRequiredSkills = requiredSkills.length;

  for (const requiredSkill of requiredSkills) {
    const workerSkill = workerSkills.find(s => s.name === requiredSkill.name);
    if (workerSkill) {
      let skillScore = 1;
      const levelScores = { beginner: 0.5, intermediate: 0.8, expert: 1 };
      skillScore += levelScores[workerSkill.level] || 0;
      skillScore += Math.min(workerSkill.yearsOfExperience / 5, 1);
      const hasRequiredCerts = requiredSkill.requiredCertifications.every(cert =>
        workerSkill.certifications.includes(cert)
      );
      if (hasRequiredCerts) skillScore += 0.5;
      matchScore += skillScore;
    }
  }

  return matchScore / totalRequiredSkills;
};

const calculateAvailabilityMatch = (worker, task) => {
  const taskDate = new Date(task.deadline);
  const dayOfWeek = taskDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  
  if (!worker.availability[dayOfWeek]) return 0;

  const taskTime = taskDate.getHours() + taskDate.getMinutes() / 60;
  const workerStart = parseInt(worker.workingHours.start.split(':')[0], 10);
  const workerEnd = worker.workingHours.end;

  if (taskTime >= workerStart && taskTime <= workerEnd) {
    return 1;
  }
  return 0.5;
};

const calculatePerformanceScore = (worker) => {
  if (!worker.workHistory || worker.workHistory.length === 0) return 0.5;

  const completedTasks = worker.workHistory.filter(session => session.endTime);
  if (completedTasks.length === 0) return 0.5;

  const totalRating = completedTasks.reduce((sum, task) => sum + (task.performanceRating || 3), 0);
  return totalRating / completedTasks.length / 5;
};

export default router;