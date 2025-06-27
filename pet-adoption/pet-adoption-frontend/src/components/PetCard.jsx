import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const PetCard = ({ pet, viewMode = 'grid', showQuickActions = true, className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Early return for invalid pet data
  if (!pet || !pet._id) {
    return null;
  }

  // Handle image loading states
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback((e) => {
    setImageError(true);
    e.target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Photo+Unavailable';
  }, []);

  // Handle favorite toggle
  const handleFavoriteClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    // TODO: Implement actual favorite functionality with backend
  }, [isFavorited]);

  // Get status styling
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'adopted': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Get age group information
  const getAgeInfo = (age) => {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return { label: age || 'Unknown', emoji: '🐾' };
    
    if (ageNum <= 2) return { label: `${age} years`, emoji: '🐶', category: 'Young' };
    if (ageNum <= 7) return { label: `${age} years`, emoji: '🐕', category: 'Adult' };
    return { label: `${age} years`, emoji: '🦮', category: 'Senior' };
  };

  // Get pet type emoji
  const getTypeEmoji = (type) => {
    switch (type?.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'bird': return '🦜';
      case 'rabbit': return '🐰';
      case 'fish': return '🐠';
      case 'reptile': return '🦎';
      default: return '🐾';
    }
  };

  const ageInfo = getAgeInfo(pet.age);
  const typeEmoji = getTypeEmoji(pet.type);

  // List view layout
  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}>
        <Link to={`/pets/${pet._id}`} className="block">
          <div className="flex">
            {/* Image Section */}
            <div className="relative w-48 h-32 flex-shrink-0">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-gray-400">Loading...</div>
                </div>
              )}
              <img
                src={pet.image}
                alt={`${pet.name} - ${pet.breed}`}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              
              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pet.status)}`}>
                  {pet.status === 'available' ? '✅ Available' : 
                   pet.status === 'pending' ? '⏳ Pending' : 
                   pet.status === 'adopted' ? '❤️ Adopted' : pet.status}
                </span>
              </div>

              {/* Favorite Button */}
              {showQuickActions && (
                <button
                  onClick={handleFavoriteClick}
                  className="absolute top-2 right-2 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <span className={`text-sm ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}>
                    {isFavorited ? '❤️' : '🤍'}
                  </span>
                </button>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {typeEmoji} {pet.name}
                  </h3>
                  <p className="text-gray-600">{pet.breed}</p>
                </div>
                {pet.location && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <span className="mr-1">📍</span>
                    {pet.location}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-gray-600 flex items-center">
                  <span className="mr-1">{ageInfo.emoji}</span>
                  {ageInfo.label}
                </span>
                {pet.size && (
                  <span className="text-sm text-gray-600 capitalize">
                    Size: {pet.size}
                  </span>
                )}
                {pet.gender && (
                  <span className="text-sm text-gray-600">
                    {pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}
                  </span>
                )}
              </div>

              {pet.description && (
                <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                  {pet.description.length > 100 
                    ? `${pet.description.substring(0, 100)}...` 
                    : pet.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-green-600 font-medium hover:text-green-700 transition-colors">
                  Learn More →
                </span>
                {pet.urgent && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    🚨 Urgent
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Grid view layout (default)
  return (
    <div className={`group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 ${className}`}>
      <Link to={`/pets/${pet._id}`} className="block">
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-400">📸</div>
            </div>
          )}
          
          <img
            src={pet.image}
            alt={`${pet.name} - ${pet.breed}`}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(pet.status)}`}>
              {pet.status === 'available' ? '✅ Available' : 
               pet.status === 'pending' ? '⏳ Pending' : 
               pet.status === 'adopted' ? '❤️ Adopted' : pet.status}
            </span>
          </div>

          {/* Urgent Badge */}
          {pet.urgent && (
            <div className="absolute top-3 right-12">
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                🚨 URGENT
              </span>
            </div>
          )}

          {/* Favorite Button */}
          {showQuickActions && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all transform hover:scale-110"
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className={`text-lg ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}>
                {isFavorited ? '❤️' : '🤍'}
              </span>
            </button>
          )}

          {/* Quick View on Hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="text-white text-center">
              <p className="text-sm opacity-90 mb-2">
                {pet.description ? 
                  (pet.description.length > 80 ? `${pet.description.substring(0, 80)}...` : pet.description)
                  : `${pet.name} is looking for a loving home!`
                }
              </p>
              <span className="inline-block bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
                View Details →
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-green-600 transition-colors">
                {typeEmoji} {pet.name}
              </h3>
              <p className="text-gray-600 font-medium">{pet.breed}</p>
            </div>
            {pet.location && (
              <div className="text-xs text-gray-500 flex items-center ml-2">
                <span className="mr-1">📍</span>
                <span className="truncate max-w-20">{pet.location}</span>
              </div>
            )}
          </div>

          {/* Pet Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">{ageInfo.emoji}</span>
              <span>{ageInfo.label}</span>
              {ageInfo.category && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {ageInfo.category}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              {pet.size && (
                <span className="capitalize">Size: {pet.size}</span>
              )}
              {pet.gender && (
                <span>{pet.gender === 'male' ? '♂️ Male' : '♀️ Female'}</span>
              )}
            </div>
          </div>

          {/* Health Indicators */}
          {(pet.vaccinated || pet.spayedNeutered || pet.microchipped) && (
            <div className="flex flex-wrap gap-1 mb-4">
              {pet.vaccinated && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  💉 Vaccinated
                </span>
              )}
              {pet.spayedNeutered && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                  ✂️ Fixed
                </span>
              )}
              {pet.microchipped && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                  📱 Chipped
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between">
            <span className="text-green-600 font-semibold group-hover:text-green-700 transition-colors">
              {pet.status === 'available' ? 'Available for Adoption' : 
               pet.status === 'pending' ? 'Adoption Pending' : 
               'View Details'}
            </span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-green-600 transform group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PetCard;