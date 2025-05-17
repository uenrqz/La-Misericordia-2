import React from 'react';
import { FaHome, FaFile, FaEnvelope, FaBell, FaMapMarkerAlt, FaChartLine } from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const monthlyData = {
    labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEP'],
    datasets: [
      {
        label: '2019',
        data: [20, 35, 30, 15, 35, 30, 42, 25, 20],
        borderColor: '#1e3a8a',
        backgroundColor: '#1e3a8a',
      },
      {
        label: '2020',
        data: [25, 20, 25, 35, 32, 35, 30, 28, 32],
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
      },
    ],
  };

  const donutData = {
    labels: ['Completado', 'Pendiente'],
    datasets: [
      {
        data: [45, 55],
        backgroundColor: ['#1e3a8a', '#fbbf24'],
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#1e3a8a] text-white p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full mb-4">
            <img src="/avatar-placeholder.png" alt="Profile" className="w-full h-full rounded-full" />
          </div>
          <h2 className="text-xl font-bold">JOHN DON</h2>
          <p className="text-sm text-gray-300">johndon@company.com</p>
        </div>

        <nav className="space-y-4">
          <a href="#" className="flex items-center space-x-3 p-2 hover:bg-blue-700 rounded">
            <FaHome /> <span>home</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-2 hover:bg-blue-700 rounded">
            <FaFile /> <span>file</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-2 hover:bg-blue-700 rounded">
            <FaEnvelope /> <span>messages</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-2 hover:bg-blue-700 rounded">
            <FaBell /> <span>notification</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-2 hover:bg-blue-700 rounded">
            <FaMapMarkerAlt /> <span>location</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-2 hover:bg-blue-700 rounded">
            <FaChartLine /> <span>graph</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard User</h1>
          <button className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1e3a8a] text-white p-6 rounded-lg">
            <h3>Earning</h3>
            <p className="text-3xl font-bold">$ 628</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3>Share</h3>
            <p className="text-3xl font-bold">2434</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3>Likes</h3>
            <p className="text-3xl font-bold">1259</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3>Rating</h3>
            <p className="text-3xl font-bold">8,5</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Result</h3>
            <Line data={monthlyData} options={{ responsive: true }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Progress</h3>
            <Doughnut data={donutData} options={{ responsive: true }} />
            <div className="mt-4">
              <p className="text-gray-600">Lorem ipsum</p>
              <p className="text-gray-600">Lorem ipsum</p>
              <p className="text-gray-600">Lorem ipsum</p>
              <p className="text-gray-600">Lorem ipsum</p>
              <button className="mt-4 bg-yellow-400 text-white px-4 py-2 rounded">
                Check Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 