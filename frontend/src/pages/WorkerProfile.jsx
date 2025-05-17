// client/src/pages/WorkerProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import RecommendedTasks from '../components/RecommendedTasks';
import SearchTasks from '../components/SearchTasks';
import AvailableTasks from '../components/AvailableTasks';
import ActiveTasks from '../components/ActiveTasks';
import CompletedTasks from '../components/CompletedTasks';

const WorkerProfile = () => {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [isWorking, setIsWorking] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSession, setCurrentSession] = useState(null);
  const [predictedHours, setPredictedHours] = useState(3.0);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('search'); // ['search', 'available', 'active', 'completed']

  const fetchWorker = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/workers/${id}`);
      setWorker(res.data);
      const ongoingSession = res.data.workHistory?.find((session) => !session.endTime);
      if (ongoingSession) {
        setIsWorking(true);
        setCurrentSession(ongoingSession);
        setSessionTime(Math.floor((Date.now() - new Date(ongoingSession.startTime)) / 1000));
        const ongoingBreak = ongoingSession.breaks?.find((b) => !b.end);
        setIsOnBreak(!!ongoingBreak);
      }
    } catch (err) {
      console.error('Fetch worker error:', err.message);
      toast.error('Failed to fetch worker profile');
    }
  };

  const fetchPrediction = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/workers/${id}/predict-hours`);
      console.log('Prediction response:', res.data, 'Status:', res.status);
      setPredictedHours(res.data.predictedHours || 3.0);
    } catch (err) {
      console.error('Prediction fetch error:', err.message, err.response?.data);
      setPredictedHours(3.0);
      toast.error('Prediction fetch failed, using default');
    }
  };

  useEffect(() => {
    fetchWorker();
    fetchPrediction();
  }, [id]);

  useEffect(() => {
    let interval;
    if (isWorking && currentSession && !isOnBreak) {
      interval = setInterval(() => {
        setSessionTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorking, currentSession, isOnBreak]);

  const startWork = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/workers/start-session`, { workerId: id });
      setIsWorking(true);
      setCurrentSession(response.data);
      setSessionTime(0);
      setIsOnBreak(false);
      await fetchWorker();
      toast.success('Work session started');
    } catch (error) {
      toast.error('Failed to start work session');
    }
  };

  const stopWork = async () => {
    try {
      await axios.post(`http://localhost:5000/api/workers/stop-session`, { workerId: id });
      setIsWorking(false);
      setSessionTime(0);
      setCurrentSession(null);
      setIsOnBreak(false);
      await fetchWorker();
      await fetchPrediction();
      toast.success('Work session stopped');
    } catch (error) {
      toast.error('Failed to stop work session');
    }
  };

  const startBreak = async () => {
    try {
      await axios.post(`http://localhost:5000/api/workers/start-break`, { workerId: id });
      setIsOnBreak(true);
      await fetchWorker();
      setCurrentSession((await axios.get(`http://localhost:5000/api/workers/${id}`)).data.workHistory.find((session) => !session.endTime));
      toast.success('Break started');
    } catch (error) {
      toast.error('Failed to start break');
    }
  };

  const endBreak = async () => {
    try {
      await axios.post(`http://localhost:5000/api/workers/end-break`, { workerId: id });
      setIsOnBreak(false);
      await fetchWorker();
      setCurrentSession((await axios.get(`http://localhost:5000/api/workers/${id}`)).data.workHistory.find((session) => !session.endTime));
      toast.success('Break ended');
    } catch (error) {
      toast.error('Failed to end break');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasShortSessions = worker?.workHistory?.every(
    (session) => session.endTime && 
    (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60) < 0.01
  );
  console.log('hasShortSessions:', hasShortSessions, 'predictedHours:', predictedHours);

  const handleTasksFound = (foundTasks) => {
    setTasks(foundTasks);
  };

  const handleTaskAccepted = () => {
    // Refresh active tasks when a new task is accepted
    setActiveTab('active');
  };

  if (!worker) return <div>Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row items-center">
            <img
              src={worker.photo ? `http://localhost:5000/${worker.photo}` : '/images/worker-placeholder.png'}
              alt={worker.name}
              className="w-32 h-32 rounded-full mb-4 md:mb-0 md:mr-6"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{worker.name}</h1>
              <p className="text-gray-600 dark:text-gray-300">Phone: {worker.phone}</p>
              <div className="mt-2">
                <p className="text-gray-600 dark:text-gray-300">Skills:</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                  {worker.skills?.map((skill, index) => (
                    <li key={index}>
                      {skill.name} ({skill.level}) - {skill.yearsOfExperience} years
                      {skill.certifications?.length > 0 && (
                        <span> - Certifications: {skill.certifications.join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Status: {worker.status}</p>
              <p className="text-gray-600 dark:text-gray-300">
                Predicted Hours for Next Session: {predictedHours.toFixed(1)} hours
                {hasShortSessions && (
                  <span className="text-yellow-600"> (Scaled for short sessions)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Work Session</h2>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <p className="text-lg text-gray-800 dark:text-white">
              {isWorking
                ? `Session Time: ${formatTime(sessionTime)}${isOnBreak ? ' (On Break)' : ''}`
                : 'No active session'}
            </p>
            <div className="mt-4 space-x-4">
              <button
                onClick={isWorking ? stopWork : startWork}
                className={`py-2 px-4 rounded ${
                  isWorking ? 'bg-red-600' : 'bg-green-600'
                } text-white`}
                disabled={isOnBreak}
              >
                {isWorking ? 'Stop Work' : 'Start Work'}
              </button>
              {isWorking && (
                <button
                  onClick={isOnBreak ? endBreak : startBreak}
                  className={`py-2 px-4 rounded ${
                    isOnBreak ? 'bg-blue-600' : 'bg-yellow-600'
                  } text-white`}
                >
                  {isOnBreak ? 'End Break' : 'Start Break'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('search')}
                className={`py-2 px-4 ${
                  activeTab === 'search'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Search Tasks
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-4 ${
                  activeTab === 'available'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Available Tasks
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-2 px-4 ${
                  activeTab === 'active'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-2 px-4 ${
                  activeTab === 'completed'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Completed Tasks
              </button>
            </nav>
          </div>

          {activeTab === 'search' && (
            <>
              <SearchTasks onTasksFound={handleTasksFound} />
              <div className="mt-6">
                <RecommendedTasks workerId={id} tasks={tasks} />
              </div>
            </>
          )}
          {activeTab === 'available' && (
            <AvailableTasks workerId={id} onTaskAccepted={handleTaskAccepted} />
          )}
          {activeTab === 'active' && <ActiveTasks workerId={id} />}
          {activeTab === 'completed' && <CompletedTasks workerId={id} />}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Work History</h2>
          {worker.workHistory?.length > 0 ? (
            <ul className="space-y-4">
              {worker.workHistory
                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                .map((session, index) => (
                  <li key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-gray-800 dark:text-white">
                      Start: {new Date(session.startTime).toLocaleString()}
                    </p>
                    <p className="text-gray-800 dark:text-white">
                      End: {session.endTime ? new Date(session.endTime).toLocaleString() : 'Ongoing'}
                    </p>
                    {session.endTime && (
                      <p className="text-gray-800 dark:text-white">
                        Duration:{' '}
                        {(
                          (new Date(session.endTime) - new Date(session.startTime)) /
                          (1000 * 60 * 60)
                        ).toFixed(2)}{' '}
                        hours
                      </p>
                    )}
                    {session.taskType && (
                      <p className="text-gray-800 dark:text-white">Task Type: {session.taskType}</p>
                    )}
                    {session.taskDifficulty && (
                      <p className="text-gray-800 dark:text-white">
                        Difficulty: {session.taskDifficulty}
                      </p>
                    )}
                    {session.performanceRating && (
                      <p className="text-gray-800 dark:text-white">
                        Performance Rating: {session.performanceRating}/5
                      </p>
                    )}
                    <p className="text-gray-800 dark:text-white">
                      Breaks:{' '}
                      {session.breaks?.length > 0 ? (
                        <ul className="ml-4 list-disc">
                          {session.breaks.map((b, i) => (
                            <li key={i}>
                              Start: {new Date(b.start).toLocaleString()}, End:{' '}
                              {b.end ? new Date(b.end).toLocaleString() : 'Ongoing'}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        'None'
                      )}
                    </p>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">No work history available.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WorkerProfile;