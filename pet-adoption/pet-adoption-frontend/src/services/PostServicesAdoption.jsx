import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/admin/adoption-requests`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getAllAdoptions = async () => {
  try {
    const response = await axios.get(BASE_URL, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching adoption requests:', error);
    throw error;
  }
};

export const getAdoptionById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching adoption request with id ${id}:`, error);
    throw error;
  }
};

export const createAdoption = async (data) => {
  try {
    const response = await axios.post(BASE_URL, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error creating adoption request:', error);
    throw error;
  }
};

export const deleteAdoption = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error deleting adoption request with id ${id}:`, error);
    throw error;
  }
};

export const updateAdoption = async (id, updatedFields) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${id}`, updatedFields, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error updating adoption request with id ${id}:`, error);
    throw error;
  }
};
