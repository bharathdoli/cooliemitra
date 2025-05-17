import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/workers/getWorker');
      setWorkers(response.data);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to fetch workers');
    }
  };

  const handleAcceptWorker = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/workers/${id}/accept`);
      toast.success('Worker accepted successfully');
      fetchWorkers();
    } catch (error) {
      console.error('Error accepting worker:', error);
      toast.error('Failed to accept worker');
    }
  };

  const handleRejectWorker = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/workers/${id}/reject`);
      toast.success('Worker rejected successfully');
      fetchWorkers();
    } catch (error) {
      console.error('Error rejecting worker:', error);
      toast.error('Failed to reject worker');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Worker Management</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3 text-white font-semibold">Select</th>
                  <th className="p-3 text-white font-semibold">Name</th>
                  <th className="p-3 text-white font-semibold">Phone</th>
                  <th className="p-3 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker._id} className="border-b dark:border-gray-700">
                    <td className="p-3 text-center">
                      <input type="checkbox" className="form-checkbox h-5 w-5" />
                    </td>
                    <td className="p-3 text-white">{worker.name}</td>
                    <td className="p-3 text-white">{worker.phone}</td>
                    <td className="p-3">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleAcceptWorker(worker._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectWorker(worker._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard; 