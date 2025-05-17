import express from 'express';
import Task from '../models/Task.js';
import Worker from '../models/Worker.js';

const router = express.Router();

/**
 * @route   POST /api/tasks/create-dummy
 * @desc    Create dummy electrician tasks for testing
 */
router.post('/create-dummy', async (req, res) => {
  try {
    console.log('Starting to create dummy electrician tasks...');
    
    // First, check if there are any existing tasks
    const existingTasks = await Task.find();
    console.log('Existing tasks count:', existingTasks.length);

    const dummyTasks = [
      {
        title: "Electrician Wiring Installation",
        description: "Install electrical wiring for a new office building",
        requiredSkills: [
          {
            name: "Electrician",
            minimumLevel: "expert",
            requiredCertifications: ["Electrical Safety", "Advanced Wiring"]
          }
        ],
        difficulty: "hard",
        estimatedDuration: 8,
        location: {
          address: "123 Business Park, City",
          coordinates: {
            latitude: 12.9716,
            longitude: 77.5946
          }
        },
        priority: "high",
        status: "available",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: "Electrician Outlet Repair",
        description: "Repair power outlets in a residential complex",
        requiredSkills: [
          {
            name: "Electrician",
            minimumLevel: "beginner",
            requiredCertifications: ["Basic Electrical Safety"]
          }
        ],
        difficulty: "easy",
        estimatedDuration: 2,
        location: {
          address: "321 Home Street, City",
          coordinates: {
            latitude: 12.9631,
            longitude: 77.5933
          }
        },
        priority: "low",
        status: "available",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      },
      {
        title: "Electrician Panel Upgrade",
        description: "Upgrade electrical panel to support new equipment",
        requiredSkills: [
          {
            name: "Electrician",
            minimumLevel: "intermediate",
            requiredCertifications: ["Electrical Safety", "Circuit Management"]
          }
        ],
        difficulty: "medium",
        estimatedDuration: 5,
        location: {
          address: "456 Industrial Zone, City",
          coordinates: {
            latitude: 12.9784,
            longitude: 77.6408
          }
        },
        priority: "medium",
        status: "available",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      },
      {
        title: "Electrician Lighting Installation",
        description: "Install LED lighting fixtures in a commercial space",
        requiredSkills: [
          {
            name: "Electrician",
            minimumLevel: "intermediate",
            requiredCertifications: ["Electrical Safety"]
          }
        ],
        difficulty: "medium",
        estimatedDuration: 4,
        location: {
          address: "789 Commercial Complex, City",
          coordinates: {
            latitude: 12.9850,
            longitude: 77.7060
          }
        },
        priority: "medium",
        status: "available",
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
      }
    ];

    // Clear existing tasks to avoid duplicates
    console.log('Clearing existing tasks...');
    await Task.deleteMany({});
    console.log('Existing tasks cleared');

    // Insert dummy tasks
    console.log('Inserting dummy electrician tasks...');
    const createdTasks = await Task.insertMany(dummyTasks);
    console.log('Dummy electrician tasks created successfully:', createdTasks.length);

    // Verify the tasks were created
    const verifyTasks = await Task.find();
    console.log('Verification - Tasks in database:', verifyTasks.length);

    res.status(201).json({
      message: 'Dummy electrician tasks created successfully',
      count: createdTasks.length,
      tasks: createdTasks
    });
  } catch (err) {
    console.error('Error in create-dummy route:', err);
    res.status(500).json({ 
      error: 'Failed to create dummy electrician tasks: ' + err.message,
      stack: err.stack
    });
  }
});

/**
 * @route   GET /api/tasks/debug
 * @desc    Debug route to check tasks in database
 */
router.get('/debug', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json({
      count: tasks.length,
      tasks: tasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /api/tasks/debug/all
 * @desc    Debug route to check all tasks in database
 */
router.get('/debug/all', async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json({
      count: tasks.length,
      tasks: tasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching tasks: ' + err.message });
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task: ' + err.message });
  }
});

/**
 * @route   POST /api/tasks/:taskId/complete
 * @desc    Mark a task as completed and update worker performance
 */
router.post('/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { workerId, performanceRating, notes } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task status
    task.status = 'completed';
    task.completedBy = workerId;
    task.completionDate = new Date();
    task.performanceRating = performanceRating;
    task.completionNotes = notes;

    // Update worker's work history
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const ongoingSession = worker.workHistory.find(session => !session.endTime);
    if (ongoingSession) {
      ongoingSession.taskType = task.title;
      ongoingSession.taskDifficulty = task.difficulty;
      ongoingSession.performanceRating = performanceRating;
    }

    await Promise.all([task.save(), worker.save()]);

    res.json({
      message: 'Task completed successfully',
      task,
      worker: {
        id: worker._id,
        name: worker.name,
        performanceRating: performanceRating
      }
    });
  } catch (err) {
    console.error('Error completing task:', err);
    res.status(500).json({ error: 'Failed to complete task: ' + err.message });
  }
});

/**
 * @route   GET /api/tasks/worker/:workerId
 * @desc    Get all tasks assigned to a specific worker
 */
router.get('/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    const tasks = await Task.find({ completedBy: workerId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching worker tasks: ' + err.message });
  }
});

/**
 * @route   GET /api/tasks/available
 * @desc    Get all available tasks
 */
router.get('/available', async (req, res) => {
  try {
    const tasks = await Task.find({ status: 'available' });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/tasks/worker/:workerId/active
 * @desc    Get worker's active tasks
 */
router.get('/worker/:workerId/active', async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedWorker: req.params.workerId,
      status: 'assigned'
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/tasks/worker/:workerId/completed
 * @desc    Get worker's completed tasks
 */
router.get('/worker/:workerId/completed', async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedWorker: req.params.workerId,
      status: 'completed'
    }).sort({ completionDate: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/tasks/worker/:workerId/stats
 * @desc    Get worker's task statistics
 */
router.get('/worker/:workerId/stats', async (req, res) => {
  try {
    const completedTasks = await Task.find({
      assignedWorker: req.params.workerId,
      status: 'completed'
    });

    const totalTasks = completedTasks.length;
    const ratedTasks = completedTasks.filter(task => task.performanceRating);
    const averageRating = ratedTasks.length > 0
      ? ratedTasks.reduce((acc, task) => acc + task.performanceRating, 0) / ratedTasks.length
      : 0;

    const onTimeCompletions = completedTasks.filter(task => 
      new Date(task.completionDate) <= new Date(task.deadline)
    ).length;

    const onTimeCompletion = totalTasks > 0 ? onTimeCompletions / totalTasks : 0;

    res.json({
      totalTasks,
      averageRating,
      onTimeCompletion
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/tasks/:taskId/accept
 * @desc    Accept a task
 */
router.post('/:taskId/accept', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'available') {
      return res.status(400).json({ message: 'Task is not available' });
    }

    task.status = 'assigned';
    task.assignedWorker = req.body.workerId;
    task.assignedAt = new Date();
    await task.save();

    // Return both the updated task and all active tasks for this worker
    const activeTasks = await Task.find({
      assignedWorker: req.body.workerId,
      status: 'assigned'
    });

    res.json({
      acceptedTask: task,
      activeTasks: activeTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/tasks/:taskId/complete
 * @desc    Complete a task
 */
router.post('/:taskId/complete', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'assigned') {
      return res.status(400).json({ message: 'Task is not assigned' });
    }

    if (task.assignedWorker.toString() !== req.body.workerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    task.status = 'completed';
    task.completionDate = new Date();
    task.completionNotes = req.body.completionNotes;
    await task.save();

    // Update worker's task history
    await Worker.findByIdAndUpdate(req.body.workerId, {
      $push: {
        taskHistory: {
          taskId: task._id,
          completedAt: task.completionDate,
          onTime: task.completionDate <= task.deadline
        }
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   POST /api/tasks/:taskId/rate
 * @desc    Rate a completed task
 */
router.post('/:taskId/rate', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Task is not completed' });
    }

    task.performanceRating = req.body.rating;
    task.feedback = req.body.feedback;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;