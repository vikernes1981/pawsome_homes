import axios from 'axios';

const API_URL_PETS = 'http://localhost:5000/api/pets';

export const getAllPets = async () => {
  const res = await axios.get(`${API_URL_PETS}`);
  return res.data;
};

export const addPet = async (newPet) => {
  await axios.post(`${API_URL_PETS}`, newPet);
};

export const updatePet = async (id, updatedPet) => {
  await axios.put(`${API_URL_PETS}/${id}`, updatedPet);
};

export const deletePet = async (id) => {
  await axios.delete(`${API_URL_PETS}/${id}`);
};

export const getPetById = async (id) => {
  const res = await axios.get(`${API_URL_PETS}/${id}`);
  return res.data;
};

