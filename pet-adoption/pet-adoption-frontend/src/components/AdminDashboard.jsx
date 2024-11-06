import React, { useState } from 'react';
import ManagePets from './ManagePets';
import ManageAdoptionRequests from './ManageAdoptionRequests';
import ManageUsers from './ManageUsers';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pets');

  return (
    <div className="max-w-4xl mx-auto p-16 bg-gray-200 shadow-lg rounded-lg mt-20">
      <h1 className="text-3xl font-bold text-center mb-6 text-green-700">Admin Dashboard</h1>

      <div className="tabs flex justify-around mb-8 space-x-4">
        <button 
          className={`px-6 py-3 rounded-lg font-semibold shadow-lg ${activeTab === 'pets' ? 'bg-green-600 text-white' : 'bg-gray-400 text-black hover:bg-gray-300'}`} 
          onClick={() => setActiveTab('pets')}
        >
          Manage Pets
        </button>
        <button 
          className={`px-6 py-3 rounded-lg font-semibold shadow-lg ${activeTab === 'requests' ? 'bg-green-600 text-white' : 'bg-gray-400 text-black hover:bg-gray-300'}`} 
          onClick={() => setActiveTab('requests')}
        >
          Adoption Requests
        </button>
        <button 
          className={`px-6 py-3 rounded-lg font-semibold shadow-lg ${activeTab === 'users' ? 'bg-green-600 text-white' : 'bg-gray-400 text-black hover:bg-gray-300'}`} 
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
      </div>

      <div className="content mt-8">
        {activeTab === 'pets' && <ManagePets />}
        {activeTab === 'requests' && <ManageAdoptionRequests />}
        {activeTab === 'users' && <ManageUsers />}
      </div>
    </div>
  );
};

export default AdminDashboard;
