import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  const [workers, setWorkers] = useState([]);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/workers/getWorker?status=accepted')
      .then((res) => setWorkers(res.data))
      .catch((err) => toast.error('Failed to fetch workers'));
    axios
      .get('http://localhost:5000/api/workers/getWorker?status=pending')
      .then((res) => setPendingWorkers(res.data))
      .catch((err) => toast.error('Failed to fetch pending workers'));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return isNaN(date) ? '—' : date.toLocaleString();
  };

  const handleAccept = async (id) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/workers/${id}/accept`);
      setPendingWorkers(pendingWorkers.filter((w) => w._id !== id));
      setWorkers([...workers, res.data]);
      toast.success('Worker accepted');
    } catch (err) {
      toast.error('Failed to accept worker');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/workers/${id}/reject`);
      setPendingWorkers(pendingWorkers.filter((w) => w._id !== id));
      toast.success('Worker rejected');
    } catch (err) {
      toast.error('Failed to reject worker');
    }
  };

  const handleBulkAccept = async () => {
    try {
      await Promise.all(
        selectedWorkers.map((id) =>
          axios.post(`http://localhost:5000/api/workers/${id}/accept`)
        )
      );
      const accepted = pendingWorkers.filter((w) => selectedWorkers.includes(w._id));
      setPendingWorkers(pendingWorkers.filter((w) => !selectedWorkers.includes(w._id)));
      setWorkers([...workers, ...accepted]);
      setSelectedWorkers([]);
      toast.success('Selected workers accepted');
    } catch (err) {
      toast.error('Failed to accept workers');
    }
  };

  const handleBulkReject = async () => {
    try {
      await Promise.all(
        selectedWorkers.map((id) =>
          axios.post(`http://localhost:5000/api/workers/${id}/reject`)
        )
      );
      setPendingWorkers(pendingWorkers.filter((w) => !selectedWorkers.includes(w._id)));
      setSelectedWorkers([]);
      toast.success('Selected workers rejected');
    } catch (err) {
      toast.error('Failed to reject workers');
    }
  };

  const toggleSelectWorker = (id) => {
    setSelectedWorkers((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const filteredWorkers = workers.filter(
    (w) => w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900"
    >
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Admin Dashboard
      </h1>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search workers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Pending Workers */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
          Pending Workers
        </h2>
        {pendingWorkers.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No pending workers.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4">
              <button
                onClick={handleBulkAccept}
                disabled={selectedWorkers.length === 0}
                className="bg-secondary text-white px-4 py-2 rounded mr-2 hover:bg-green-700 disabled:bg-gray-400"
              >
                Accept Selected
              </button>
              <button
                onClick={handleBulkReject}
                disabled={selectedWorkers.length === 0}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Reject Selected
              </button>
            </div>
            <table className="min-w-full table-auto bg-white rounded shadow dark:bg-gray-800">
              <thead>
                <tr className="bg-primary text-white dark:bg-gray-700">
                  <th className="px-4 py-2">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedWorkers(
                          e.target.checked
                            ? pendingWorkers.map((w) => w._id)
                            : []
                        )
                      }
                      checked={
                        selectedWorkers.length === pendingWorkers.length &&
                        pendingWorkers.length > 0
                      }
                    />
                  </th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingWorkers.map((w) => (
                  <tr key={w._id} className="text-center border-t dark:border-gray-700">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(w._id)}
                        onChange={() => toggleSelectWorker(w._id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/worker-profile/${w._id}`}
                        className="text-secondary hover:underline"
                      >
                        {w.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{w.phone}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleAccept(w._id)}
                        className="bg-secondary text-white px-4 py-1 rounded mr-2 hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(w._id)}
                        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accepted Workers */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
        Accepted Workers
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto bg-white rounded shadow dark:bg-gray-800">
          <thead>
            <tr className="bg-primary text-white dark:bg-gray-700">
              <th className="px-4 py-2">Worker</th>
              <th className="px-4 py-2">Start Time</th>
              <th className="px-4 py-2">End Time</th>
              <th className="px-4 py-2">Paid</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map((w) => (
              <tr key={w._id} className="text-center border-t dark:border-gray-700">
                <td className="px-4 py-2">
                  <Link
                    to={`/worker-profile/${w._id}`}
                    className="text-secondary hover:underline"
                  >
                    {w.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{formatDate(w.startTime)}</td>
                <td className="px-4 py-2">{formatDate(w.endTime)}</td>
                <td className="px-4 py-2">{w.isPaid ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AdminPage;