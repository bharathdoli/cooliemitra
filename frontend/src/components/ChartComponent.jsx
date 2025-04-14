// client/src/components/ChartComponent.jsx
import React from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(...registerables);

const ChartComponent = ({ type, data, title }) => {
  if (!data.labels || data.labels.length === 0 || data.datasets[0].data.every((v) => v === 0)) {
    return <div className="text-gray-600 dark:text-gray-300">No meaningful data for {title}. Try adding longer work sessions.</div>;
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
    },
  };

  return (
    <div>
      <Chart type={type} data={data} options={options} />
    </div>
  );
};

export default ChartComponent;