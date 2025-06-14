import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PetCard from '../components/PetCard';

const PetList = () => {
  const [pets, setPets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState({ breed: '', location: '', type: '' });

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/pets`);
        setPets(data);
        setFiltered(data);
      } catch (err) {
        setError('Failed to load pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [API_URL]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const filteredData = pets.filter((pet) => {
        return (
          (search.breed === '' || pet.breed.toLowerCase().includes(search.breed.toLowerCase())) &&
          (search.location === '' || pet.location?.toLowerCase().includes(search.location.toLowerCase())) &&
          (search.type === '' || pet.type.toLowerCase() === search.type.toLowerCase())
        );
      });
      setFiltered(filteredData);
    }, 200);

    return () => clearTimeout(timeout);
  }, [search, pets]);

  if (loading) return <div className="text-center mt-10 text-white">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <form className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by breed"
          className="input input-bordered"
          onChange={(e) => setSearch((prev) => ({ ...prev, breed: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Location"
          className="input input-bordered"
          onChange={(e) => setSearch((prev) => ({ ...prev, location: e.target.value }))}
        />
        <select
          className="select select-bordered"
          onChange={(e) => setSearch((prev) => ({ ...prev, type: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
        </select>
      </form>

      {filtered.length === 0 ? (
        <div className="text-white text-center">No pets found matching your search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((pet) => (
            <PetCard key={pet._id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PetList;
