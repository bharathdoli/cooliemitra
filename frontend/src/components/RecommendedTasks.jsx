import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import TaskCompletionModal from './TaskCompletionModal';

const RecommendedTasks = ({ workerId, tasks: propTasks }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [sortBy, setSortBy] = useState('matchScore'); // 'matchScore', 'deadline', 'duration'
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerProfession, setWorkerProfession] = useState('');

  useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setTasks(propTasks);
      setLoading(false);
    } else {
      fetchTasks();
    }
  }, [workerId, propTasks]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/workers/${workerId}/tasks`);
      setTasks(res.data);
      // Get worker's profession from the first task's required skills
      if (res.data.length > 0) {
        setWorkerProfession(res.data[0].task.requiredSkills[0]?.name || '');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to fetch recommended tasks');
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/workers/${workerId}/accept-task/${taskId}`);
      setSelectedTask(response.data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error accepting task:', err);
      toast.error('Failed to accept task');
    }
  };

  const handleTaskComplete = async (completionData) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/workers/${workerId}/tasks`);
      setTasks(res.data);
      toast.success('Task completed successfully!');
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      toast.error('Failed to refresh tasks');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.priority === filter;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'matchScore':
        return (b.matchScore || 0) - (a.matchScore || 0);
      case 'deadline':
        return new Date(a.deadline) - new Date(b.deadline);
      case 'duration':
        return a.estimatedDuration - b.estimatedDuration;
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="text-center p-4">Loading recommended tasks...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Recommended Tasks</h2>
          {workerProfession && (
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Showing tasks related to your profession: <span className="font-semibold">{workerProfession}</span>
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
          >
            <option value="all">All Tasks</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded"
          >
            <option value="matchScore">Best Match</option>
            <option value="deadline">Deadline</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-4">Loading recommended tasks...</div>
      ) : sortedTasks.length === 0 ? (
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-300">No recommended tasks available.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click "Create Tasks" to generate new tasks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTasks.map((task, index) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{task.title}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="font-medium">{task.estimatedDuration} hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Deadline:</span>
                  <span className="font-medium">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Difficulty:</span>
                  <span className="font-medium capitalize">{task.difficulty}</span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleAcceptTask(task._id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Accept Task
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <TaskCompletionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskId={selectedTask?._id}
        workerId={workerId}
        onComplete={handleTaskComplete}
      />
    </motion.div>
  );
};

export default RecommendedTasks; 