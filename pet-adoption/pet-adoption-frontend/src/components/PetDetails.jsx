import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPetById } from '../services/PostServicesPets';
import { AuthContext } from '../context/AuthProvider';

const PetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Fetch pet data
  const fetchPet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const petData = await getPetById(id);
      setPet(petData);
      
      // Debug: Log the pet data structure to understand image format
      console.log('Pet data received:', petData);
      console.log('Pet image field:', petData.image);
      console.log('Pet images field:', petData.images);
      
      setShareUrl(window.location.href);
      
      // Check if pet is favorited (you'd implement this with your backend)
      // const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      // setIsFavorited(favorites.includes(id));
    } catch (error) {
      console.error('Error fetching pet data:', error);
      setError('Unable to load pet details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const handleAdoptClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/pet/${id}` } });
    } else {
      navigate(`/adopt/${pet._id}`);
    }
  };

  const handleContactShelter = () => {
    setShowContactModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet ${pet.name} - Available for Adoption`,
          text: `${pet.name} is a ${pet.age} year old ${pet.breed} looking for a loving home!`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.log('Could not copy link');
      }
    }
  };

  const toggleFavorite = () => {
    // Implement favorite functionality
    setIsFavorited(!isFavorited);
    // You'd save this to backend/localStorage
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'adopted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getAgeGroup = (age) => {
    const ageNum = parseInt(age);
    if (ageNum <= 2) return { label: 'Young', emoji: '🐶' };
    if (ageNum <= 7) return { label: 'Adult', emoji: '🐕' };
    return { label: 'Senior', emoji: '🦮' };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading Pet Details</h2>
          <p className="text-gray-500">Getting all the adorable details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl text-red-500 mb-4">😿</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pet Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This pet may have been adopted or is no longer available.'}</p>
          <div className="space-y-3">
            <button
              onClick={fetchPet}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
            <Link to="/pet-list">
              <button className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
                Browse Other Pets
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle different image data structures - simplified to match working PetCard
  const getImages = () => {
    // First try the images array if it exists
    if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
      return pet.images.filter(Boolean);
    }
    // Otherwise use the single image field that works in PetCard
    if (pet.image) {
      return [pet.image];
    }
    return [];
  };
  
  const images = getImages();
  const ageGroup = getAgeGroup(pet.age);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-green-600">Home</Link>
            <span>→</span>
            <Link to="/pet-list" className="hover:text-green-600">Browse Pets</Link>
            <span>→</span>
            <span className="text-gray-900">{pet.name}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              
              {/* Main Image */}
              <div className="relative">
                <img
                  src={images.length > 0 ? images[currentImageIndex] : pet.image}
                  alt={`${pet.name} - Photo ${currentImageIndex + 1}`}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    console.log('Image failed to load:', e.target.src);
                    e.target.src = 'https://via.placeholder.com/600x400/f3f4f6/9ca3af?text=Photo+Unavailable';
                  }}
                />
                
                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(pet.status)}`}>
                    {pet.status === 'available' ? '✅ Available' : 
                     pet.status === 'pending' ? '⏳ Pending' : 
                     pet.status === 'adopted' ? '❤️ Adopted' : pet.status}
                  </span>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={toggleFavorite}
                  className="absolute top-4 right-4 w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <span className={`text-2xl ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}>
                    {isFavorited ? '❤️' : '🤍'}
                  </span>
                </button>

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                    >
                      →
                    </button>
                  </>
                )}
              </div>

              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? 'border-green-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${pet.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Pet Description */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About {pet.name}</h2>
                <p className="text-gray-700 leading-relaxed">
                  {pet.description || `${pet.name} is a wonderful ${pet.breed} looking for a loving forever home. This adorable companion would make a great addition to any family!`}
                </p>
                
                {pet.specialNeeds && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">🏥 Special Care Notes</h3>
                    <p className="text-blue-700">{pet.specialNeeds}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{pet.name}</h1>
              <p className="text-xl text-gray-600 mb-6">{pet.breed}</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Age</span>
                  <span className="flex items-center">
                    <span className="mr-2">{ageGroup.emoji}</span>
                    {pet.age} years ({ageGroup.label})
                  </span>
                </div>

                {pet.size && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Size</span>
                    <span className="capitalize">{pet.size}</span>
                  </div>
                )}

                {pet.gender && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Gender</span>
                    <span>{pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}</span>
                  </div>
                )}

                {pet.weight && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Weight</span>
                    <span>{pet.weight}</span>
                  </div>
                )}

                {pet.location && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Location</span>
                    <span className="flex items-center">
                      <span className="mr-1">📍</span>
                      {pet.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Health Info */}
              {(pet.vaccinated || pet.spayedNeutered || pet.microchipped) && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">🏥 Health Information</h3>
                  <div className="space-y-2">
                    {pet.vaccinated && (
                      <div className="flex items-center text-green-600">
                        <span className="mr-2">✅</span>
                        Vaccinated
                      </div>
                    )}
                    {pet.spayedNeutered && (
                      <div className="flex items-center text-green-600">
                        <span className="mr-2">✅</span>
                        Spayed/Neutered
                      </div>
                    )}
                    {pet.microchipped && (
                      <div className="flex items-center text-green-600">
                        <span className="mr-2">✅</span>
                        Microchipped
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Interested in {pet.name}?</h3>
              
              <div className="space-y-4">
                <button
                  onClick={handleAdoptClick}
                  disabled={pet.status !== 'available'}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                    pet.status === 'available'
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600 transform hover:-translate-y-1 hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {pet.status === 'available' ? '🐾 Start Adoption Process 🐾' : 
                   pet.status === 'pending' ? '⏳ Adoption Pending' : 
                   '❤️ Already Adopted'}
                </button>

                <button
                  onClick={handleContactShelter}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  📞 Contact Shelter
                </button>

                <button
                  onClick={handleShare}
                  className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  📤 Share {pet.name}
                </button>
              </div>

              {!isAuthenticated && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>💡 Tip:</strong> <Link to="/login" className="underline">Sign in</Link> to save your favorite pets and speed up the adoption process!
                  </p>
                </div>
              )}
            </div>

            {/* Additional Links */}
            {pet.link && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">More Information</h3>
                <a
                  href={pet.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  🔗 View Original Listing
                  <span className="ml-1">↗</span>
                </a>
              </div>
            )}

            {/* Adoption Tips */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Adoption Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 mt-1">✓</span>
                  Prepare your home with pet supplies
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">✓</span>
                  Schedule a meet & greet first
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">✓</span>
                  Ask about the pet's history and needs
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1">✓</span>
                  Be patient during the adjustment period
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Pets Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">You Might Also Love</h2>
          <div className="text-center">
            <Link to="/pet-list">
              <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                Browse More Pets
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetails;