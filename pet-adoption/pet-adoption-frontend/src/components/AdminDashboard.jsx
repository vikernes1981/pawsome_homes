import React, { useState, useEffect } from 'react';
import { Users, Heart, PlusCircle, Activity, TrendingUp, AlertTriangle, Calendar, BarChart3, Eye, Clock, CheckCircle } from 'lucide-react';
import ManagePets from './ManagePets';
import ManageAdoptionRequests from './ManageAdoptionRequests';
import ManageUsers from './ManageUsers';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPets: 0,
    availablePets: 0,
    pendingAdoptions: 0,
    adoptedPets: 0,
    totalUsers: 0,
    totalInquiries: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [urgentItems, setUrgentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const getApiUrl = (endpoint) => {
    // Use the same base URL as your other API calls
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${endpoint}`;
  };

  const handleResponse = async (response, endpoint) => {
    if (response.status === 304) {
      console.warn(`No new data for ${endpoint} (304 Not Modified)`);
      return { data: [] };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from ${endpoint}:`, errorText);
      throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    if (!text) {
      return { data: [] };
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(`Invalid JSON from ${endpoint}:`, text);
      throw new Error(`Invalid JSON response from ${endpoint}`);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      console.log('Fetching dashboard data...');

      // Fetch pets data - Using correct API URL
      let petsData = [];
      try {
        const petsResponse = await fetch(getApiUrl('/api/pets'), { headers });
        petsData = await handleResponse(petsResponse, 'pets');
      } catch (error) {
        console.error('Error fetching pets:', error);
        // Continue with empty data
      }
      
      // Pets API returns array directly
      const pets = Array.isArray(petsData) ? petsData : [];
      
      // Fetch users data - Using correct API URL
      let usersData = { users: [] };
      try {
        const usersResponse = await fetch(getApiUrl('/api/users'), { headers });
        usersData = await handleResponse(usersResponse, 'users');
      } catch (error) {
        console.error('Error fetching users:', error);
        // Continue with empty data
      }
      
      // Users API returns { users: [...] }
      const users = usersData.users || [];
      
      // Fetch adoption requests data - Using correct API URL
      let adoptionsData = { data: [] };
      try {
        const adoptionsResponse = await fetch(getApiUrl('/admin/adoption-requests'), { headers });
        adoptionsData = await handleResponse(adoptionsResponse, 'adoption-requests');
      } catch (error) {
        console.error('Error fetching adoptions:', error);
        // Continue with empty data
      }
      
      // Adoption requests API returns { data: [...] }
      const adoptions = adoptionsData.data || [];
      
      console.log('Fetched data:', { pets: pets.length, users: users.length, adoptions: adoptions.length });
      
      // Calculate statistics
      const availablePets = pets.filter(pet => 
        ['available', 'pending'].includes(pet.status || pet.adoptionStatus)
      ).length;
      
      const adoptedPets = pets.filter(pet => 
        pet.status === 'adopted' || pet.adoptionStatus === 'adopted'
      ).length;
      
      const pendingAdoptions = adoptions.filter(adoption => 
        ['pending', 'Pending'].includes(adoption.status)
      ).length;
      
      const totalInquiries = pets.reduce((sum, pet) => 
        sum + (pet.inquiryCount || pet.inquiries?.length || 0), 0
      );
      
      setStats({
        totalPets: pets.length,
        availablePets,
        adoptedPets,
        pendingAdoptions,
        totalUsers: users.length,
        totalInquiries
      });
      
      // Generate recent activity from pets and adoptions
      const activity = [];
      
      // Recent adoptions
      const recentAdoptions = adoptions
        .filter(adoption => ['approved', 'Approved', 'completed', 'Completed'].includes(adoption.status))
        .sort((a, b) => new Date(b.createdAt || b.submittedAt || 0) - new Date(a.createdAt || a.submittedAt || 0))
        .slice(0, 3);
      
      recentAdoptions.forEach(adoption => {
        activity.push({
          id: `adoption-${adoption._id}`,
          type: 'adoption',
          message: `${adoption.pet?.name || 'Pet'} was adopted by ${adoption.applicantName || adoption.user?.username || 'Unknown'}`,
          time: formatTimeAgo(adoption.createdAt || adoption.submittedAt),
          status: 'success'
        });
      });
      
      // Recent pet additions
      const recentPets = pets
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3);
      
      recentPets.forEach(pet => {
        activity.push({
          id: `pet-${pet._id}`,
          type: 'pet_added',
          message: `${pet.name} (${pet.breed}) was added to the system`,
          time: formatTimeAgo(pet.createdAt),
          status: 'info'
        });
      });
      
      // Recent inquiries (if pets have inquiry data)
      pets.forEach(pet => {
        if (pet.inquiries && pet.inquiries.length > 0) {
          const recentInquiry = pet.inquiries[pet.inquiries.length - 1];
          activity.push({
            id: `inquiry-${pet._id}`,
            type: 'inquiry',
            message: `New inquiry for ${pet.name} from ${recentInquiry.inquirerName || 'Unknown'}`,
            time: formatTimeAgo(recentInquiry.inquiryDate),
            status: 'info'
          });
        }
      });
      
      // Sort activity by most recent
      activity.sort((a, b) => {
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB;
      });
      
      setRecentActivity(activity.slice(0, 5));
      
      // Generate urgent items
      const urgent = [];
      
      // Pets needing attention
      pets.forEach(pet => {
        if (pet.healthStatus === 'needs_attention') {
          urgent.push({
            id: `health-${pet._id}`,
            type: 'Medical',
            pet: pet.name,
            message: 'Needs medical attention',
            priority: 'high'
          });
        }
        
        if (pet.urgentAdoption) {
          urgent.push({
            id: `urgent-${pet._id}`,
            type: 'Adoption',
            pet: pet.name,
            message: pet.urgentReason || 'Urgent adoption needed',
            priority: 'high'
          });
        }
        
        // Pets in care for too long
        const intakeDate = new Date(pet.intakeDate || pet.createdAt);
        const daysSince = Math.floor((new Date() - intakeDate) / (1000 * 60 * 60 * 24));
        if (daysSince > 180) { // 6 months
          urgent.push({
            id: `longterm-${pet._id}`,
            type: 'Long-term',
            pet: pet.name,
            message: `In care for ${daysSince} days`,
            priority: 'medium'
          });
        }
      });
      
      // Pending adoption requests
      const pendingRequests = adoptions.filter(adoption => 
        ['pending', 'Pending'].includes(adoption.status)
      );
      
      pendingRequests.slice(0, 3).forEach(request => {
        urgent.push({
          id: `pending-${request._id}`,
          type: 'Adoption',
          pet: request.pet?.name || 'Unknown Pet',
          message: 'Pending adoption approval',
          priority: 'medium'
        });
      });
      
      setUrgentItems(urgent.slice(0, 6));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  const parseTimeAgo = (timeString) => {
    if (timeString === 'Just now') return 0;
    const match = timeString.match(/(\d+)\s+(minute|hour|day|month)s?\s+ago/);
    if (!match) return 0;
    const [, num, unit] = match;
    const multipliers = { minute: 1, hour: 60, day: 1440, month: 43200 };
    return parseInt(num) * (multipliers[unit] || 0);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue", trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg bg-${color}-50`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const statusConfig = {
      success: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      info: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' }
    };

    const config = statusConfig[activity.status] || statusConfig.info;

    return (
      <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
          {activity.type.replace('_', ' ')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">{activity.message}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {activity.time}
          </p>
        </div>
      </div>
    );
  };

  const UrgentItem = ({ item }) => {
    const priorityConfig = {
      high: { border: 'border-l-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' },
      medium: { border: 'border-l-yellow-500', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
      low: { border: 'border-l-green-500', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' }
    };

    const config = priorityConfig[item.priority] || priorityConfig.medium;

    return (
      <div className={`border-l-4 p-4 rounded-r-lg ${config.border} ${config.bg} hover:shadow-sm transition-shadow`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{item.type}: {item.pet}</h4>
            <p className="text-sm text-gray-600">{item.message}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.badge}`}>
            {item.priority}
          </span>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-green-600 text-white shadow-lg transform scale-105'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm border border-gray-200'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  if (loading && activeTab === 'overview') {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pt-24">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pt-24">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your pet adoption platform</p>
        </div>
        <div className="mt-4 lg:mt-0">
          <button 
            onClick={() => setActiveTab('pets')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Quick Add Pet</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 mb-8">
        <TabButton
          id="overview"
          label="Overview"
          icon={BarChart3}
          isActive={activeTab === 'overview'}
          onClick={setActiveTab}
        />
        <TabButton
          id="pets"
          label="Manage Pets"
          icon={Heart}
          isActive={activeTab === 'pets'}
          onClick={setActiveTab}
        />
        <TabButton
          id="adoptions"
          label="Adoption Requests"
          icon={Activity}
          isActive={activeTab === 'adoptions'}
          onClick={setActiveTab}
        />
        <TabButton
          id="users"
          label="Manage Users"
          icon={Users}
          isActive={activeTab === 'users'}
          onClick={setActiveTab}
        />
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={fetchDashboardData}
                  className="ml-auto px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={Heart}
              title="Total Pets"
              value={stats.totalPets}
              subtitle="In the system"
              color="blue"
            />
            <StatCard
              icon={CheckCircle}
              title="Available Pets"
              value={stats.availablePets}
              subtitle="Ready for adoption"
              color="green"
            />
            <StatCard
              icon={Clock}
              title="Pending Adoptions"
              value={stats.pendingAdoptions}
              subtitle="Awaiting approval"
              color="yellow"
            />
            <StatCard
              icon={Activity}
              title="Adopted Pets"
              value={stats.adoptedPets}
              subtitle="Success stories"
              color="purple"
            />
            <StatCard
              icon={Users}
              title="Total Users"
              value={stats.totalUsers}
              subtitle="Registered users"
              color="indigo"
            />
            <StatCard
              icon={Eye}
              title="Total Inquiries"
              value={stats.totalInquiries}
              subtitle="Pet inquiries"
              color="pink"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                {recentActivity.length > 0 ? (
                  recentActivity.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>

            {/* Urgent Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Needs Attention</h2>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-4">
                {urgentItems.length > 0 ? (
                  urgentItems.map(item => (
                    <UrgentItem key={item.id} item={item} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-500">All caught up! 🎉</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modular Component Integration */}
      {activeTab === 'pets' && <ManagePets />}
      {activeTab === 'adoptions' && <ManageAdoptionRequests />}
      {activeTab === 'users' && <ManageUsers />}
    </div>
  );
};

export default AdminDashboard;