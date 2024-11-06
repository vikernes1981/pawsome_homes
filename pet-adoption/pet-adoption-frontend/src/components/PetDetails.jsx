import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPetById } from '../services/PostServicesPets'; 

// PetDetails Component
const PetDetails = () => {
  const { id } = useParams(); // Get the pet id from the URL
  const [pet, setPet] = useState(null); // State to hold pet data
  const [loading, setLoading] = useState(true); // Loading state
  const navigate = useNavigate(); // Hook for navigation
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to check authentication status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      if (decodedToken.role === 'User') {
        setIsAuthenticated(true);
        return true; // Admin user
      }
      setIsAuthenticated(true);
      return true; // Authenticated user
    }
    return false; // Not authenticated
  };

  // Fetch the pet data when the component loads
  useEffect(() => {
    const fetchPet = async () => {
      try {
        const petData = await getPetById(id); // Fetch the pet data
        console.log('Pet Data:', petData); // Debug log
        setPet(petData); // Set pet directly from the returned data
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pet data:', error);
        setLoading(false);
      }
    };
    
    fetchPet();
    checkAuthStatus(); // Check authentication status on load
  }, [id]);

  // If the data is still loading, show a loading message
  if (loading) return <div>Loading...</div>;

  // If the pet data is null (i.e., not found or failed to load), show an error
  if (!pet) return <h2>Pet not found</h2>;

  // Function to handle the adoption process
  const handleAdoptClick = () => {
    if (!isAuthenticated) {
      // If the user is not logged in, redirect to the login page
      navigate('/login');
    } else {
      // If the user is logged in, proceed to the adoption form
      navigate(`/adopt/${pet._id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-32">
      <div className="card shadow-lg rounded-lg overflow-hidden">
        <img src={pet.image} alt={pet.name} className="object-contain h-96 w-full" />
        <div className="p-6">
          <h1 className="text-3xl font-bold">{pet.name}</h1>
          <p className="text-xl">{pet.breed}</p>

          {/* Additional Pet Details */}
          <p className="mt-4"><strong>Age:</strong> {pet.age} years old</p>
          <p className="mt-2"><strong>Status:</strong> {pet.status}</p>
          <p className="mt-2"><strong>Personality:</strong> {pet.description}</p>

          <a href={pet.link} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 underline">
            <strong>More about this pet</strong>
          </a>
          <br />

          {/* Adopt Me Button */}
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
