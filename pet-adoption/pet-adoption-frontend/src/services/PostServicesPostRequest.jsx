import axios from 'axios';

const API_URL_ADOPTION = `${import.meta.env.VITE_API_URL}/api/adoption-requests`;

export const createRequest = async (data) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(API_URL_ADOPTION, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ← ADD THIS
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating adoption request:', error.response || error.message);
    throw error;
  }
};
