import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const ActiveTasks = ({ workerId }) => {
  const [activeTasks, setActiveTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActiveTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/tasks/worker/${workerId}/active`);
      setActiveTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch active tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      fetchActiveTasks();
    }
  }, [workerId]);

  // Set up polling to check for new tasks every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (workerId) {
        fetchActiveTasks();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [workerId]);

  const completeTask = async (taskId) => {
    try {
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/complete`, {
        workerId,
        completionNotes: 'Task completed successfully'
      });
      toast.success('Task marked as completed');
      fetchActiveTasks();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const getProgressColor = (deadline) => {
    const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'bg-red-600';
    if (daysLeft < 2) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Active Tasks</h2>
        <button
          onClick={fetchActiveTasks}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {activeTasks.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No active tasks.</p>
      ) : (
        <div className="space-y-4">
          {activeTasks.map((task) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {task.title}
                    </h3>
                    <span className={`text-sm text-white px-2 py-1 rounded ${getProgressColor(task.deadline)}`}>
                      {getTimeRemaining(task.deadline)}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {task.description}
                  </p>
                  <div className="mt-2 space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Started: {new Date(task.assignedAt).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Duration: {task.estimatedDuration} hours
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => completeTask(task._id)}
                  className="bg-secondary text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
                >
                  Mark Complete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveTasks; 