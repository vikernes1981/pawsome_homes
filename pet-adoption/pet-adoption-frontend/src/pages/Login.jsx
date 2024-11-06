import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/login', formData);
      const { token } = response.data;

      localStorage.setItem('authToken', token); // Store token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set default authorization header

      setAuth(true); // Update auth state

      alert('Login successful');
      navigate('/');
      window.location.reload(); // Reload the navbar
    } catch (err) {
      console.error(err);
      alert('Login failed: Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto p-16 bg-gray-200 shadow-lg rounded-lg mt-20">
      <h1 className="text-3xl font-bold text-center mb-6 text-green-700">Login</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-lg font-semibold text-gray-700">Email:</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-lg font-semibold text-gray-700">Password:</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            onChange={(e) => setFormData({ ...formData, password: e.target.value.trim() })}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        {/* Forgot Password Link */}
        {/* <div className="text-center mt-4">
          <Link to="/ForgotPassword" className="text-sm text-blue-500 hover:underline">
            Forgot your password?
          </Link>
        </div> */}
      </form>

      {/* Sign Up Section */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
