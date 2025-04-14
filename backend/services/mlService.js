// server/services/mlService.js
import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const predictWorkHours = async (workerData) => {
  return new Promise((resolve) => {
    console.log('Predicting hours for worker:', workerData._id, 'WorkHistory:', workerData.workHistory);
    const options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: path.join(__dirname, '..', 'ml'),
      args: [JSON.stringify(workerData)],
    };

    PythonShell.run('predict.py', options, (err, results) => {
      if (err) {
        console.error('ML Prediction Error:', err.message, err.stack);
        resolve(3.0);
        return;
      }
      try {
        console.log('Python raw output:', results);
        const prediction = parseFloat(results[0]);
        console.log('Parsed prediction:', prediction);
        if (isNaN(prediction) || prediction < 0) {
          console.error('Invalid prediction:', results);
          resolve(3.0);
        } else {
          resolve(prediction);
        }
      } catch (parseErr) {
        console.error('Parse error:', parseErr.message, 'Raw output:', results);
        resolve(3.0);
      }
    });
  });
};

export { predictWorkHours };