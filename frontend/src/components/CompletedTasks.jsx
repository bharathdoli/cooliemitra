import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const CompletedTasks = ({ workerId }) => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    averageRating: 0,
    onTimeCompletion: 0
  });

  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const [tasksResponse, statsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/tasks/worker/${workerId}/completed`),
        axios.get(`http://localhost:5000/api/tasks/worker/${workerId}/stats`)
      ]);
      setCompletedTasks(tasksResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch completed tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      fetchCompletedTasks();
    }
  }, [workerId]);

  const getCompletionStatus = (task) => {
    const completedDate = new Date(task.completedAt);
    const deadline = new Date(task.deadline);
    return completedDate <= deadline ? 'On Time' : 'Late';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Completed Tasks</h2>
        <button
          onClick={fetchCompletedTasks}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Tasks</h3>
          <p className="text-2xl text-primary dark:text-blue-400">{stats.totalTasks}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Average Rating</h3>
          <p className="text-2xl text-primary dark:text-blue-400">
            {stats.averageRating.toFixed(1)} / 5.0
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">On-Time Completion</h3>
          <p className="text-2xl text-primary dark:text-blue-400">
            {(stats.onTimeCompletion * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {completedTasks.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No completed tasks yet.</p>
      ) : (
        <div className="space-y-4">
          {completedTasks.map((task) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    {task.description}
                  </p>
                  <div className="mt-2 space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Completed: {new Date(task.completedAt).toLocaleDateString()}
                    </span>
                    <span className={`text-sm text-white px-2 py-1 rounded ${
                      getCompletionStatus(task) === 'On Time' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {getCompletionStatus(task)}
                    </span>
                    {task.rating && (
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Rating: {task.rating}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedTasks; 