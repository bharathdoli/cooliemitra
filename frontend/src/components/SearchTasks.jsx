import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const SearchTasks = ({ onTasksFound }) => {
  const handleSearchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      toast.success('Tasks found successfully!');
      if (onTasksFound) {
        onTasksFound(response.data);
      }
    } catch (error) {
      console.error('Error searching tasks:', error);
      toast.error('Failed to search tasks');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Task Management</h2>
        <button
          onClick={handleSearchTasks}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Search Tasks
        </button>
      </div>
    </motion.div>
  );
};

export default SearchTasks; 