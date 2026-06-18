import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const ApplicationsChart = ({ data }) => {
  const chartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Applications',
        data: [data.pending, data.approved, data.rejected],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',  // Orange for pending
          'rgba(34, 197, 94, 0.8)',   // Green for approved
          'rgba(220, 53, 69, 0.8)'    // Red for rejected
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Application Status Overview',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="chart-container mb-4">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export const ProjectsChart = ({ projects }) => {
  const chartData = {
    labels: projects.map(p => p.name),
    datasets: [
      {
        label: 'Total Units',
        data: projects.map(p => p.totalUnits || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Available Units',
        data: projects.map(p => p.availableUnits || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Projects Overview',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  return (
    <div className="chart-container mb-4">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export const StatusPieChart = ({ data }) => {
  const chartData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [data.pending, data.approved, data.rejected],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',  // Orange
          'rgba(34, 197, 94, 0.8)',   // Green
          'rgba(220, 53, 69, 0.8)'    // Red
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Application Status Distribution',
        font: {
          size: 16
        }
      },
    },
  };

  return (
    <div className="chart-container mb-4">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export const MonthlyTrendsChart = ({ applications }) => {
  // Group applications by month
  const monthlyData = applications.reduce((acc, app) => {
    const month = new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { pending: 0, approved: 0, rejected: 0 };
    }
    acc[month][app.status]++;
    return acc;
  }, {});

  const labels = Object.keys(monthlyData).slice(-6); // Last 6 months
  const pendingData = labels.map(month => monthlyData[month]?.pending || 0);
  const approvedData = labels.map(month => monthlyData[month]?.approved || 0);
  const rejectedData = labels.map(month => monthlyData[month]?.rejected || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Pending',
        data: pendingData,
        borderColor: 'rgba(255, 193, 7, 1)',
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Approved',
        data: approvedData,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Rejected',
        data: rejectedData,
        borderColor: 'rgba(220, 53, 69, 1)',
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      chart: {
        title: {
          display: true,
          text: 'Monthly Application Trends',
          font: {
            size: 16
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  return (
    <div className="chart-container mb-4">
      <Line data={chartData} options={options} />
    </div>
  );
};
