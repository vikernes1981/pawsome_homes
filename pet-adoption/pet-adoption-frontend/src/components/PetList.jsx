import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PetList = () => {
  const [pets, setPets] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true); // Optional: Loading state
  const [error, setError] = useState(null); // Optional: Error handling
  const [search, setSearch] = useState({ breed: '', location: '', type: '' }); // Search state

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data } = await axios.get('http://localhost/api/pets');
        setPets(data); // Ensure data is an array
        setLoading(false); // Data is loaded
      } catch (err) {
        setError('Failed to load pets');
        setLoading(false); // Stop loading in case of error
      }
    };
    fetchPets();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!Array.isArray(pets)) {
    return <div>No pets available</div>; // Additional check
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {pets.map((pet) => (
          <div key={pet._id} className="card bg-base-100 shadow-md p-4">
            <img src={pet.image} alt={pet.name} className="w-full h-48 object-cover rounded" />
            <h2 className="text-lg font-bold mt-2">{pet.name}</h2>
            <p>{pet.breed}</p>
            <p>{pet.location}</p>
            <p>{pet.description}</p>
          </div>
        ))}
      </div>

      <form className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by breed"
          onChange={(e) => setSearch({ ...search, breed: e.target.value })}
        />
        <input
          type="text"
          placeholder="Location"
          onChange={(e) => setSearch({ ...search, location: e.target.value })}
        />
        <select onChange={(e) => setSearch({ ...search, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
    </div>
  );
};

export default PetList;
