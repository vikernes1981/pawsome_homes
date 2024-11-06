import axios from 'axios';

const API_URL_USERS = 'http://localhost:5000/admin/users';

export const getAllUsers = async () => {
  try {
    const response = await axios.get(API_URL_USERS);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await axios.get(`${API_URL_USERS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    throw error;
  }
};

export const createUser = async (user) => {
  try {
    const response = await axios.post(API_URL_USERS, user, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, updatedData) => {
  try {
      const response = await axios.patch(`${API_URL_USERS}/${id}`, updatedData);
      return response.data;
  } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      throw error;
  }
};

export const deleteUser = async (id) => {
  console.log(`Deleting user with ID: ${id}`); // Log the ID to confirm it's correct
  try {
    const response = await axios.delete(`${API_URL_USERS}/${id}`);
    return response.data; // Optionally return a success message
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error; // Throw error to be caught in frontend
  }
};
