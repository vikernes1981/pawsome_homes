import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPetById } from '../services/PostServicesPets';

const PetDetails = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const petData = await getPetById(id);
        setPet(petData);
      } catch (error) {
        console.error('Error fetching pet data:', error);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);

    fetchPet();
  }, [id]);

  const handleAdoptClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/adopt/${pet._id}`);
    }
  };

  if (loading) return <div className="text-center mt-10 text-lg text-white">Loading...</div>;
  if (!pet) return <div className="text-center mt-10 text-red-500">Pet not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-32">
      <div className="card shadow-lg rounded-lg overflow-hidden">
        <img src={pet.image} alt={pet.name} className="object-contain h-96 w-full" />
        <div className="p-6">
          <h1 className="text-3xl font-bold">{pet.name}</h1>
          <p className="text-xl">{pet.breed}</p>

          <p className="mt-4"><strong>Age:</strong> {pet.age} years old</p>
          <p className="mt-2"><strong>Status:</strong> {pet.status}</p>
          <p className="mt-2"><strong>Personality:</strong> {pet.description}</p>

          {pet.link && (
            <a
              href={pet.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-600 underline block"
            >
              <strong>More about this pet</strong>
            </a>
          )}

          <button
            onClick={handleAdoptClick}
            className="mt-6 bg-pink-500 text-white py-3 px-6 rounded-full hover:bg-pink-600 
            transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-lg
            animate-bounce focus:outline-none focus:ring-4 focus:ring-pink-300"
          >
            🐾 Adopt Me 🐾
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetDetails;
