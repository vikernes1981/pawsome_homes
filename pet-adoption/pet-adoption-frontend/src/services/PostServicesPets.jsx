import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/pets`;

export const getAllPets = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching pets:', error);
    throw error;
  }
};

export const getPetById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching pet with id ${id}:`, error);
    throw error;
  }
};

export const addPet = async (newPet) => {
  try {
    const response = await axios.post(BASE_URL, newPet);
    return response.data;
  } catch (error) {
    console.error('Error adding pet:', error);
    throw error;
  }
};

export const updatePet = async (id, updatedPet) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, updatedPet);
    return response.data;
  } catch (error) {
    console.error(`Error updating pet with id ${id}:`, error);
    throw error;
  }
};

export const deletePet = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting pet with id ${id}:`, error);
    throw error;
  }
};
