import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../services/PostServicesUsers';

const ManageUsers = () => {
  // State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'create', 'edit'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
    profile: {
      firstName: '',
      lastName: '',
      phone: ''
    },
    address: {
      city: '',
      country: 'Germany'
    }
  });

  const [formErrors, setFormErrors] = useState({});

  // Constants
  const ROLES = [
    { value: 'user', label: 'User' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'foster', label: 'Foster' },
    { value: 'staff', label: 'Staff' },
    { value: 'admin', label: 'Admin' }
  ];

  // Fetch users
  const fetchUsers = async () => {
    console.log('Token exists:', localStorage.getItem('accessToken'));
    console.log('Making request to:', `${import.meta.env.VITE_API_URL}/api/users`);
    try {
      setLoading(true);
      setError(null);
      const response = await getAllUsers();
      setUsers(Array.isArray(response) ? response : response.users || []);
    } catch (err) {
      setError(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Form handling
  const resetForm = () => {
  setFormData({
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active', // Add this line
    profile: { firstName: '', lastName: '', phone: '' },
    address: { city: '', country: 'Germany' }
  });
  setFormErrors({});
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (modalMode === 'create' && !formData.password) errors.password = 'Password is required';
    if (!formData.role) errors.role = 'Role is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD operations
const handleCreateUser = async () => {
  if (!validateForm()) return;

  try {
    console.log('🔍 Debug - Form data being sent:', JSON.stringify(formData, null, 2));
    
    await createUser(formData);
    setSuccess(`User ${formData.username} created successfully!`);
    setIsModalOpen(false);
    resetForm();
    fetchUsers();
  } catch (err) {
    console.log('🔍 Debug - Full error object:', err);
    const errorMessage = err.details ? 
      `Validation errors: ${err.details.map(d => d.message || d).join(', ')}` :
      err.message;
    setError(`Error creating user: ${errorMessage}`);
  }
};

const handleUpdateUser = async () => {
  if (!validateForm()) return;

  try {
    const updateData = { ...formData };
    if (!updateData.password) delete updateData.password;
    
    await updateUser(selectedUser._id, updateData);
    setSuccess(`User ${formData.username} updated successfully!`);
    setIsModalOpen(false);
    setSelectedUser(null);
    resetForm();
    fetchUsers();
  } catch (err) {
    // Better error handling
    const errorMessage = err.details ? 
      `Validation errors: ${err.details.map(d => d.message || d).join(', ')}` :
      err.message;
    setError(`Error updating user: ${errorMessage}`);
  }
};

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      await deleteUser(userId);
      setSuccess(`User ${username} deleted successfully!`);
      fetchUsers();
    } catch (err) {
      setError(`Error deleting user: ${err.message}`);
    }
  };

  // Modal management
  const openModal = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    
    if (mode === 'create') {
      resetForm();
    } else if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
        status: user.status || 'active', // Add this line
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          phone: user.profile?.phone || ''
        },
        address: {
          city: user.address?.city || '',
          country: user.address?.country || 'Germany'
        }
      });
    }
  
  setIsModalOpen(true);
};

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      pending_verification: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
        {status || 'inactive'}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      user: 'bg-blue-100 text-blue-800',
      volunteer: 'bg-green-100 text-green-800',
      staff: 'bg-orange-100 text-orange-800',
      admin: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.user}`}>
        {role || 'user'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-600">Add, edit, and manage all users in your system</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add User
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Active</h3>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Admins</h3>
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {users.filter(u => u.status === 'pending_verification').length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openModal('view', user)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openModal('edit', user)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id, user.username)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No users found</p>
            <button
              onClick={() => openModal('create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add First User
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {modalMode === 'create' ? 'Add New User' : 
                 modalMode === 'edit' ? `Edit ${selectedUser?.username}` : 
                 `User Details - ${selectedUser?.username}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalMode === 'view' ? (
              /* View Mode */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="text-sm text-gray-900">{selectedUser?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">{selectedUser?.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedUser?.status}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => openModal('edit', selectedUser)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Edit User
                  </button>
                </div>
              </div>
            ) : (
              /* Create/Edit Mode */
              <form onSubmit={(e) => {
                e.preventDefault();
                modalMode === 'create' ? handleCreateUser() : handleUpdateUser();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter username"
                  />
                  {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email"
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {modalMode === 'edit' ? '(Leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={modalMode === 'edit' ? 'Leave blank to keep current' : 'Enter password'}
                  />
                  {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    name="status"
                    value={formData.status || 'active'}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                  {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {modalMode === 'create' ? 'Create User' : 'Update User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;