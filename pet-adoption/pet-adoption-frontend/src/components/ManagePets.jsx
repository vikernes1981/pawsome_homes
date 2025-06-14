import { useState, useEffect } from 'react';
import { getAllPets, addPet, updatePet, deletePet } from '../services/PostServicesPets';

const EMPTY_FORM = {
  name: '',
  age: '',
  breed: '',
  type: '',
  description: '',
  image: '',
  link: '',
};

const ManagePets = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const res = await getAllPets();
      setPets(res);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreatePet = async () => {
    try {
      await addPet(formData);
      await fetchPets();
      setFormData({ ...EMPTY_FORM });
      alert('Pet added successfully');
    } catch (err) {
      console.error('Create error:', err);
      alert('Error adding pet');
    }
  };

  const handleUpdatePet = async () => {
    try {
      await updatePet(selectedPet._id, formData);
      await fetchPets();
      setSelectedPet(null);
      setFormData({ ...EMPTY_FORM });
      alert('Pet updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      alert('Error updating pet');
    }
  };

  const handleDeletePet = async (petId) => {
    try {
      await deletePet(petId);
      await fetchPets();
      setSelectedPet(null);
      alert('Pet deleted');
    } catch (error) {
      console.error('Failed to delete pet:', error);
      alert('Error deleting pet');
    }
  };

  const handleEditPet = (pet) => {
    setSelectedPet(pet);
    setFormData({
      name: pet.name || '',
      age: pet.age || '',
      breed: pet.breed || '',
      type: pet.type || '',
      description: pet.description || '',
      image: pet.image || '',
      link: pet.link || '',
    });
  };

  const handleCancelEdit = () => {
    setSelectedPet(null);
    setFormData({ ...EMPTY_FORM });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-semibold text-gray-800 mb-8">Manage Pets</h2>

      {loading ? (
        <div className="text-center text-lg text-gray-600">Loading pets...</div>
      ) : (
        <>
          {/* Pet Selector */}
          <div className="mb-6 space-y-2">
            <select
              className="select select-bordered w-full"
              onChange={(e) => {
                const pet = pets.find((p) => p._id === e.target.value);
                if (pet) handleEditPet(pet);
              }}
            >
              <option value="">Select a pet to edit or delete</option>
              {pets.map((pet) => (
                <option key={pet._id} value={pet._id}>
                  {pet.name} ({pet.breed})
                </option>
              ))}
            </select>

            {selectedPet && (
              <div className="flex gap-2">
                <button
                  className="btn btn-error"
                  onClick={() => handleDeletePet(selectedPet._id)}
                >
                  Delete
                </button>
                <button className="btn btn-outline" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="bg-white p-6 rounded shadow-lg">
            {['name', 'age', 'breed', 'description', 'image', 'link'].map((field) => (
              <div key={field} className="form-control mb-4">
                <input
                  type="text"
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="input input-bordered w-full"
                />
              </div>
            ))}

            <div className="form-control mb-6">
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

            {selectedPet ? (
              <button className="btn btn-primary w-full" onClick={handleUpdatePet}>
                Update Pet
              </button>
            ) : (
              <button className="btn btn-success w-full" onClick={handleCreatePet}>
                Create Pet
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ManagePets;
