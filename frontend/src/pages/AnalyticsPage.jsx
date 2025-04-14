// client/src/pages/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import ChartComponent from '../components/ChartComponent';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const AnalyticsPage = () => {
  const [workers, setWorkers] = useState([]);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/workers/getWorker?status=accepted')
      .then((res) => {
        console.log('Workers fetched:', res.data);
        setWorkers(res.data);
        Promise.all(
          res.data.map((worker) =>
            axios
              .get(`http://localhost:5000/api/workers/${worker._id}/predict-hours`)
              .then((res) => {
                console.log(`Prediction for ${worker._id}:`, res.data);
                return res.data.predictedHours || 2.0;
              })
              .catch((err) => {
                console.error(`Prediction error for ${worker._id}:`, err.response?.data, err.message);
                return 2.0;
              })
          )
        )
          .then((results) => {
            console.log('All predictions:', results);
            setPredictions(results);
          })
          .catch((err) => {
            console.error('Failed to fetch predictions:', err);
            toast.error('Some predictions unavailable');
          });
      })
      .catch((err) => {
        console.error('Worker fetch error:', err.response?.data, err.message);
        toast.error('Failed to fetch analytics data');
      });
  }, []);

  const hoursData = {
    labels: workers.map((w) => w.name),
    datasets: [
      {
        label: 'Hours Worked',
        data: workers.map((w) => {
          if (!w.workHistory) return 0;
          return w.workHistory.reduce((sum, session) => {
            if (session.startTime && session.endTime) {
              return sum + (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60);
            }
            return sum;
          }, 0);
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: '#10B981',
        borderWidth: 1,
      },
    ],
  };

  const predictionData = {
    labels: workers.map((w) => w.name),
    datasets: [
      {
        label: 'Predicted Hours for Next Session',
        data: predictions,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Analytics Dashboard
        </h1>
        <Link
          to="/admin"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Back to Admin
        </Link>
      </div>
      {workers.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          No accepted workers. Add workers in Admin Dashboard to see analytics.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <ChartComponent
              type="bar"
              data={hoursData}
              title="Hours Worked by Worker"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <ChartComponent
              type="line"
              data={hoursData}
              title="Worker Activity Trend"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <ChartComponent
              type="bar"
              data={predictionData}
              title="Predicted Hours for Next Session"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsPage;