import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaPhone, 
  FaMapMarkerAlt, 
  FaGlobe, 
  FaStar, 
  FaDirections,
  FaArrowLeft,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
  FaImages,
  FaHeart,
  FaShare,
  FaInfoCircle
} from 'react-icons/fa';

const TierheimDetails = () => {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const fetchPlaceDetails = useCallback(async () => {
    if (!placeId) {
      setError('No place ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate Google Maps API availability
      if (!window.google?.maps?.places) {
        throw new Error('Google Maps Places API not available');
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        placeId,
        fields: [
          'name', 
          'formatted_phone_number', 
          'international_phone_number',
          'formatted_address', 
          'photos', 
          'website', 
          'rating',
          'user_ratings_total',
          'opening_hours',
          'reviews',
          'place_id',
          'geometry',
          'types',
          'price_level',
          'business_status'
        ],
      };

      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          setPlaceDetails(place);
        } else {
          let errorMessage = 'Unable to load place details';
          
          switch (status) {
            case window.google.maps.places.PlacesServiceStatus.NOT_FOUND:
              errorMessage = 'This location could not be found';
              break;
            case window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              errorMessage = 'No details available for this location';
              break;
            case window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
              errorMessage = 'Too many requests. Please try again later';
              break;
            case window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
              errorMessage = 'Request denied. Please check permissions';
              break;
            case window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
              errorMessage = 'Invalid request for place details';
              break;
            default:
              errorMessage = `Unable to load details (${status})`;
          }
          
          console.error('Google Places error:', status, place);
          setError(errorMessage);
        }
        setLoading(false);
      });

    } catch (err) {
      console.error('Fetch error:', err);
      setError('An unexpected error occurred while loading details');
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchPlaceDetails();
  }, [fetchPlaceDetails]);

  const handleDirections = useCallback(() => {
    if (placeDetails?.geometry?.location) {
      const lat = placeDetails.geometry.location.lat();
      const lng = placeDetails.geometry.location.lng();
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }, [placeDetails]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: placeDetails?.name || 'Animal Shelter',
      text: `Check out ${placeDetails?.name || 'this animal shelter'} on Pawsome Homes!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.log('Could not copy link');
      }
    }
  }, [placeDetails]);

  const nextPhoto = useCallback(() => {
    if (placeDetails?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === placeDetails.photos.length - 1 ? 0 : prev + 1
      );
    }
  }, [placeDetails]);

  const prevPhoto = useCallback(() => {
    if (placeDetails?.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? placeDetails.photos.length - 1 : prev - 1
      );
    }
  }, [placeDetails]);

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="text-yellow-400 opacity-50" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="text-gray-300" />);
    }
    
    return stars;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Shelter Details</h2>
          <p className="text-gray-500">Please wait while we fetch the information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Details</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchPlaceDetails}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <FaArrowLeft className="mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header with Navigation */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Map
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 sm:mb-0">
              {placeDetails?.name || 'Animal Shelter'}
            </h1>
            <button
              onClick={handleShare}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaShare className="mr-2" />
              Share
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Photos Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              {placeDetails?.photos && placeDetails.photos.length > 0 ? (
                <div className="relative">
                  <div className="relative h-96 bg-gray-200">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaSpinner className="animate-spin text-2xl text-gray-400" />
                      </div>
                    )}
                    <img
                      src={placeDetails.photos[currentPhotoIndex].getUrl({ 
                        maxWidth: 800, 
                        maxHeight: 600 
                      })}
                      alt={`${placeDetails.name} - Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  </div>
                  
                  {placeDetails.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                      >
                        <FaArrowLeft />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
                      >
                        <FaArrowLeft className="rotate-180" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {placeDetails.photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === currentPhotoIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentPhotoIndex + 1} / {placeDetails.photos.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FaImages className="text-4xl mx-auto mb-4" />
                    <p>No photos available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            {placeDetails?.reviews && placeDetails.reviews.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Reviews</h2>
                <div className="space-y-6">
                  {placeDetails.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-center mb-3">
                        <img 
                          src={review.profile_photo_url || '/default-avatar.png'} 
                          alt={review.author_name}
                          className="w-12 h-12 rounded-full mr-4"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzAgMzJjMC02LTYtMTAtMTAtMTBzLTEwIDQtMTAgMTAiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-800">{review.author_name}</div>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm text-gray-500">
                              {new Date(review.time * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                {/* Rating */}
                {placeDetails?.rating && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                    <div className="flex items-center">
                      <FaStar className="text-yellow-400 mr-2" />
                      <span className="font-semibold">Rating</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        {renderStars(placeDetails.rating)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {placeDetails.rating}/5 ({placeDetails.user_ratings_total || 0} reviews)
                      </div>
                    </div>
                  </div>
                )}

                {/* Address */}
                <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                  <FaMapMarkerAlt className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">Address</div>
                    <div className="text-gray-600">
                      {placeDetails?.formatted_address || 'Not available'}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                {placeDetails?.formatted_phone_number && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <FaPhone className="text-blue-600 mr-3" />
                    <div>
                      <div className="font-semibold text-gray-800 mb-1">Phone</div>
                      <a 
                        href={`tel:${placeDetails.formatted_phone_number}`}
                        className="text-blue-600 hover:underline"
                      >
                        {placeDetails.formatted_phone_number}
                      </a>
                    </div>
                  </div>
                )}

                {/* Website */}
                {placeDetails?.website && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <FaGlobe className="text-purple-600 mr-3" />
                    <div>
                      <div className="font-semibold text-gray-800 mb-1">Website</div>
                      <a
                        href={placeDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline break-all"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}

                {/* Opening Hours */}
                {placeDetails?.opening_hours && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center mb-2">
                      <FaClock className="text-orange-600 mr-2" />
                      <span className="font-semibold text-gray-800">Hours</span>
                    </div>
                    <div className="text-sm space-y-1">
                      {placeDetails.opening_hours.weekday_text?.map((day, index) => (
                        <div key={index} className="text-gray-600">{day}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleDirections}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaDirections className="mr-2" />
                  Get Directions
                </button>
                
                <Link to="/pet-list">
                  <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <FaHeart className="mr-2" />
                    Browse Available Pets
                  </button>
                </Link>
                
                <Link to="/">
                  <button className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors">
                    Back to Home
                  </button>
                </Link>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Adoption Info</h4>
                  <p className="text-blue-700 text-sm">
                    Contact this shelter directly to inquire about available pets, 
                    adoption requirements, and visiting hours. Each shelter has its 
                    own adoption process and requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierheimDetails;