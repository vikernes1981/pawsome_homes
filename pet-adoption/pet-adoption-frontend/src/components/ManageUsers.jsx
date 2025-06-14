import { useState, useEffect } from 'react';
import { getAllUsers, createUser, deleteUser, updateUser } from '../services/PostServicesUsers';

const EMPTY_FORM = { username: '', email: '', password: '', role: '' };

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await getAllUsers();
    setUsers(Array.isArray(res) ? res : []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async () => {
    try {
      await createUser(formData);
      alert('User created successfully');
      fetchUsers();
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      console.error('Create failed:', err);
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = { ...formData };
      if (!formData.password) delete updateData.password; // Avoid overwriting password with empty
      await updateUser(selectedUser._id, updateData);
      alert('User updated');
      fetchUsers();
      setSelectedUser(null);
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      alert('User deleted');
      fetchUsers();
      setSelectedUser(null);
      setFormData({ ...EMPTY_FORM });
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't prefill
      role: user.role,
    });
  };

  const handleCancelEdit = () => {
    setSelectedUser(null);
    setFormData({ ...EMPTY_FORM });
  };

  return (
    <div className="manage-users p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl text-black font-semibold mb-6">Manage Users</h2>

      <select
        className="select select-bordered w-full mb-4"
        onChange={(e) => {
          const user = users.find(u => u._id === e.target.value);
          if (user) handleEditUser(user);
        }}
      >
        <option value="">Select a user</option>
        {users.map(user => (
          <option key={user._id} value={user._id}>
            {user.username} ({user.role})
          </option>
        ))}
      </select>

      {selectedUser && (
        <div className="space-x-2 mb-4">
          <button className="btn btn-error" onClick={() => handleDeleteUser(selectedUser._id)}>
            Delete
          </button>
          <button className="btn btn-secondary" onClick={handleCancelEdit}>
            Cancel
          </button>
        </div>
      )}

      <div className="user-form mt-6 p-6 bg-white rounded shadow">
        <div className="form-control mb-4">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Username"
            className="input input-bordered w-full"
            required
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email"
            className="input input-bordered w-full"
            required
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={selectedUser ? "(Leave blank to keep current)" : "Password"}
            className="input input-bordered w-full"
            required={!selectedUser}
          />
        </div>
        <div className="form-control mb-4">
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="select select-bordered w-full"
            required
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {selectedUser ? (
          <button className="btn btn-primary w-full" onClick={handleUpdateUser}>Update User</button>
        ) : (
          <button className="btn btn-success w-full" onClick={handleCreateUser}>Create User</button>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
