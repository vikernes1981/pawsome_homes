import  { useState, useEffect } from 'react';
import { getAllUsers, createUser, deleteUser, updateUser } from '../services/PostServicesUsers';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await getAllUsers();
    setUsers(res);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateUser = async () => {
    await createUser(formData);
    fetchUsers();
    setFormData({ username: '', email: '', password: '', role: '' });
  };

  const handleUpdateUser = async () => {
    await updateUser(selectedUser._id, formData);
    fetchUsers();
    setSelectedUser(null);
    setFormData({ username: '', email: '', password: '', role: '' });
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      fetchUsers(); // Refresh the user list after deletion
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Error deleting user'); // Optional: Show an alert for better UX
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({ username: user.username, email: user.email, password: '', role: user.role });
  };

  const handleCancelEdit = () => {
    setSelectedUser(null);
    setFormData({ username: '', email: '', password: '', role: '' });
  };

  return (
    <div className="manage-users p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl text-black font-semibold mb-6">Manage Users</h2>
      <div className="space-y-4">
        <select
          className="select select-bordered w-full"
          onChange={(e) => {
            const user = users.find(user => user._id === e.target.value);
            handleEditUser(user);
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
          <div className="space-x-2 mt-4">
            <button className="btn btn-error" onClick={() => {
              console.log('Delete button clicked for user:', selectedUser._id); // Log when button is clicked
              handleDeleteUser(selectedUser._id);
            }}>Delete</button>
            <button className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
          </div>
        )}
      </div>
      <div className="user-form mt-6 p-6 bg-white rounded shadow">
        <div className="form-control mb-4">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Username"
            className="input input-bordered w-full"
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
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            placeholder="Role"
            className="input input-bordered w-full"
          />
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
