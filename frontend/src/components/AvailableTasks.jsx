import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AvailableTasks = ({ onTaskAccepted }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // First try to get tasks from debug endpoint
      const response = await axios.get('http://localhost:5000/api/tasks/debug/all');
      if (response.data && response.data.tasks) {
        // Filter tasks that are available (either status is 'available' or undefined)
        const availableTasks = response.data.tasks.filter(task => 
          !task.status || task.status === 'available'
        );
        console.log('Available tasks:', availableTasks); // Debug log
        setTasks(availableTasks);
      } else {
        // Fallback to regular available tasks endpoint
        const fallbackResponse = await axios.get('http://localhost:5000/api/tasks/available');
        console.log('Fallback tasks:', fallbackResponse.data); // Debug log
        setTasks(fallbackResponse.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch available tasks');
    } finally {
      setLoading(false);
    }
  };

  const acceptTask = async (taskId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/tasks/${taskId}/accept`);
      if (response.status === 200) {
        toast.success('Task accepted successfully!');
        // Remove the accepted task from available tasks
        setTasks(tasks.filter(task => task._id !== taskId));
        // Notify parent component about the accepted task
        if (onTaskAccepted) {
          onTaskAccepted(response.data);
        }
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      toast.error('Failed to accept task');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-white">Available Tasks</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-300">No available tasks at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 shadow-lg"
            >
              <h3 className="text-xl font-semibold text-white mb-2">{task.title}</h3>
              <p className="text-gray-300 mb-2">{task.description}</p>
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                } text-white`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
              </div>
              <div className="text-gray-300 mb-2">
                <p>Duration: {task.estimatedDuration} hours</p>
                <p>Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                <p>Location: {task.location}</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {task.requiredSkills.map((skill, index) => (
                  <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    {skill}
                  </span>
                ))}
              </div>
              <button
                onClick={() => acceptTask(task._id)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300"
              >
                Accept Task
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableTasks; 