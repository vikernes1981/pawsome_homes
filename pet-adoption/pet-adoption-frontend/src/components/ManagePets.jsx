import  { useState, useEffect } from 'react';
// import Select from 'react-select';
import { getAllPets, addPet, updatePet, deletePet } from '../services/PostServicesPets';

const ManagePets = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    breed: '',
    type: '',
    description: '',
    image: '',
    link: '',
  });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    const res = await getAllPets();
    setPets(res);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreatePet = async () => {
    await addPet(formData);
    fetchPets();
    setFormData({ name: '', age: '', breed: '', type: '', description: '', image: '', link: '', });
  };

  const handleUpdatePet = async () => {
    await updatePet(selectedPet._id, formData);
    fetchPets();
    setSelectedPet(null);
    setFormData({ name: '', age: '', breed: '', type: '', description: '', image: '' , link: '', });
  };

  const handleDeletePet = async (petId) => {
    try {
      await deletePet(petId);
      fetchPets(); // Refresh the pet list after deletion
    } catch (error) {
      console.error('Failed to delete pet:', error);
      alert('Error deleting pet');
    }
  };

  const handleEditPet = (pet) => {
    setSelectedPet(pet);
    setFormData({
      name: pet.name,
      age: pet.age,
      breed: pet.breed,
      type: pet.type,
      description: pet.description,
      image: pet.image,
      link: pet.link,
    });
  };

  const handleCancelEdit = () => {
    setSelectedPet(null);
    setFormData({ name: '', age: '', breed: '', type: '', description: '', image: '', link: '', });
  };

  return (
    <div className="manage-pets  p-6 bg-gray-200 min-h-screen">
      <h2 className="text-2xl text-black font-semibold mb-6">Manage Pets</h2>
      <div className="space-y-4">
        <select
          className="select select-bordered w-full"
          onChange={(e) => {
            const pet = pets.find(pet => pet._id === e.target.value);
            handleEditPet(pet);
          }}
        >
          <option value="">Select a pet</option>
          {pets.map(pet => (
            <option key={pet._id} value={pet._id}>
              {pet.name} ({pet.breed})
            </option>
          ))}
        </select>
        {selectedPet && (
          <div className="space-x-2 mt-4">
            <button className="btn btn-error" onClick={() => handleDeletePet(selectedPet._id)}>Delete</button>
            <button className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
          </div>
        )}
      </div>
      <div className="pet-form mt-6 p-6 bg-gray-100 rounded shadow">
        <div className="form-control mb-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Name"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="text"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            placeholder="Age"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleInputChange}
            placeholder="Breed"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control mb-4">
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="select select-bordered w-full"
          >
            <option value="">Select Type</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
            <option value="Bird">Bird</option>
            <option value="Fish">Fish</option>
            <option value="Turtle">Turtle</option>
          </select>
        </div>
        <div className="form-control mb-4">
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleInputChange}
            placeholder="Image URL"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control mb-4">
          <input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleInputChange}
            placeholder="Link"
            className="input input-bordered w-full"
          />
        </div>
        {selectedPet ? (
          <button className="btn btn-primary w-full" onClick={handleUpdatePet}>Update Pet</button>
        ) : (
          <button className="btn btn-success w-full" onClick={handleCreatePet}>Create Pet</button>
        )}
      </div>
    </div>
  );
};

export default ManagePets;
