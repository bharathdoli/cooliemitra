// client/src/pages/AdminPage.jsx
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
  const [expandedWorker, setExpandedWorker] = useState(null);

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

  const getSessionCount = (workHistory) => {
    return workHistory ? workHistory.filter((session) => session.endTime).length : 0;
  };

  const toggleExpandWorker = (workerId) => {
    setExpandedWorker(expandedWorker === workerId ? null : workerId);
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
      className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Admin Dashboard
          </h1>
          <Link
            to="/analytics"
            className="bg-secondary text-white px-4 py-2 rounded hover:bg-green-700"
          >
            View Analytics
          </Link>
        </div>

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
                    <th className="px-4 py-2 text-white">Name</th>
                    <th className="px-4 py-2 text-white">Phone</th>
                    <th className="px-4 py-2 text-white">Actions</th>
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
                      <td className="px-4 py-2 text-white">
                        <Link
                          to={`/worker-profile/${w._id}`}
                          className="text-white hover:underline"
                        >
                          {w.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-white">{w.phone}</td>
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
                <th className="px-4 py-2">Sessions Worked</th>
                <th className="px-4 py-2">Paid</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((w) => (
                <React.Fragment key={w._id}>
                  <tr className="text-center border-t dark:border-gray-700">
                    <td className="px-4 py-2 text-white">
                      <Link
                        to={`/worker-profile/${w._id}`}
                        className="text-white hover:underline"
                        onClick={() => toggleExpandWorker(w._id)}
                      >
                        {w.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-white">
                      {getSessionCount(w.workHistory)}
                      {w.workHistory?.length > 0 && (
                        <button
                          onClick={() => toggleExpandWorker(w._id)}
                          className="ml-2 text-secondary hover:underline"
                        >
                          {expandedWorker === w._id ? 'Hide' : 'Show'} Sessions
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-white">{w.isPaid ? 'Yes' : 'No'}</td>
                  </tr>
                  {expandedWorker === w._id && w.workHistory?.length > 0 && (
                    <tr className="border-t dark:border-gray-700">
                      <td colSpan="3" className="px-4 py-2 text-white">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            Session Details
                          </h4>
                          <ul className="space-y-2">
                            {w.workHistory
                              .filter((session) => session.startTime)
                              .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                              .map((session, index) => (
                                <li key={index} className="text-gray-800 dark:text-white">
                                  <span>
                                    Session {index + 1}: Start: {formatDate(session.startTime)}, End:{' '}
                                    {formatDate(session.endTime)}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;