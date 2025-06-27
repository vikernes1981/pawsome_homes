import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

// Map configuration
const MAP_CONFIG = {
  containerStyle: {
    width: '100%',
    height: '100%',
  },
  defaultCenter: {
    lat: 51.1657, // Germany center
    lng: 10.4515,
  },
  libraries: ['places'],
  options: {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  },
};

// Location service types with enhanced search parameters
const LOCATION_TYPES = {
  tierheim: {
    label: 'Adoption Centers',
    keyword: 'tierheim',
    radius: 10000,
    icon: '🏠',
    color: '#10B981',
    bgColor: 'bg-green-600',
    buttonText: 'Find Adoption Centers',
  },
  petshop: {
    label: 'Pet Supply Stores', 
    keyword: 'pet supply stores',
    radius: 15000,
    icon: '🛒',
    color: '#3B82F6',
    bgColor: 'bg-blue-600',
    buttonText: 'Find Pet Shops',
  },
  veterinary: {
    label: 'Veterinarians',
    keyword: 'veterinary clinic',
    radius: 8000,
    icon: '🏥',
    color: '#EF4444',
    bgColor: 'bg-red-600',
    buttonText: 'Find Veterinarians',
  },
  dogpark: {
    label: 'Dog Parks',
    keyword: 'dog park',
    radius: 12000,
    icon: '🌳',
    color: '#8B5CF6',
    bgColor: 'bg-purple-600',
    buttonText: 'Find Dog Parks',
  },
};

const LocationServicesMap = ({ 
  initialType = 'tierheim',
  height = 'h-72',
  showTypeSelector = true,
  showStats = true,
  className = '',
}) => {
  // State management
  const [center, setCenter] = useState(MAP_CONFIG.defaultCenter);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentType, setCurrentType] = useState(initialType);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchStats, setSearchStats] = useState(null);
  
  const navigate = useNavigate();

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAP_CONFIG.libraries,
  });

  // Enhanced error handling
  const handleError = useCallback((errorMessage, errorType = 'search') => {
    console.error(`LocationServicesMap ${errorType} error:`, errorMessage);
    setError({ message: errorMessage, type: errorType });
    setLoading(false);
  }, []);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          let message = 'Unable to retrieve your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }, []);

  // Enhanced place details extraction
const extractPlaceDetails = useCallback((place) => {
  return {
    id: String(place.place_id || ''), // <- this guarantees it's a string
    position: {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    },
    placeId: place.place_id,
    name: place.name || 'Unknown',
    address: place.vicinity || place.formatted_address || 'Address not available',
    rating: place.rating || null,
    userRatingsTotal: place.user_ratings_total || 0,
    priceLevel: place.price_level || null,
    isOpen: place.opening_hours?.opening_hours || null,
    website: place.website || null,
    phoneNumber: place.formatted_phone_number || null,
    photos: place.photos ? place.photos.slice(0, 3) : [],
    types: place.types || [],
  };
}, []);


  // Calculate distance between two points
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Main search function
  const searchLocations = useCallback(async (locationType = currentType) => {
    setError(null);
    setLoading(true);
    setMarkers([]);
    setSelectedMarker(null);

    try {
      // Get user location
      const location = await getCurrentLocation();
      setCenter(location);

      // Validate Google Maps availability
      if (!window.google?.maps?.places) {
        throw new Error('Google Maps Places API not available. Please check your API key and billing setup.');
      }

      const locationConfig = LOCATION_TYPES[locationType];
      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);

      const searchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: locationConfig.radius.toString(),
        keyword: locationConfig.keyword,
        type: locationType === 'veterinary' ? 'veterinary_care' : undefined,
      };

      service.nearbySearch(searchRequest, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          // Extract and enhance place details
          const enhancedMarkers = results.map(place => {
            const details = extractPlaceDetails(place);
            const distance = calculateDistance(
              location.lat, location.lng,
              details.position.lat, details.position.lng
            );
            return { ...details, distance: Math.round(distance * 10) / 10 };
          });

          // Sort by distance
          enhancedMarkers.sort((a, b) => a.distance - b.distance);

          setMarkers(enhancedMarkers);
          setSearchStats({
            total: enhancedMarkers.length,
            type: locationConfig.label,
            searchRadius: locationConfig.radius / 1000,
            averageDistance: enhancedMarkers.length > 0 
              ? Math.round((enhancedMarkers.reduce((sum, m) => sum + m.distance, 0) / enhancedMarkers.length) * 10) / 10
              : 0,
          });

          if (enhancedMarkers.length === 0) {
            setError({
              message: `No ${locationConfig.label.toLowerCase()} found within ${locationConfig.radius/1000}km of your location.`,
              type: 'no_results'
            });
          }
        } else {
          let errorMessage = `Failed to find ${locationConfig.label.toLowerCase()}`;
          
          switch (status) {
            case window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              errorMessage = `No ${locationConfig.label.toLowerCase()} found in your area`;
              break;
            case window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
              errorMessage = 'Too many requests. Please try again later.';
              break;
            case window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
              errorMessage = 'Request denied. Please check API key permissions.';
              break;
            case window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
              errorMessage = 'Invalid search request.';
              break;
          }
          
          handleError(errorMessage);
        }
        setLoading(false);
      });

    } catch (error) {
      handleError(error.message, 'location');
    }
  }, [currentType, getCurrentLocation, extractPlaceDetails, calculateDistance, handleError]);

  // Memoized map options
  const mapOptions = useMemo(() => ({
    ...MAP_CONFIG.options,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  }), []);

  // Handle marker click with enhanced info
  const handleMarkerClick = useCallback((marker) => {
    setSelectedMarker(marker);
  }, []);

  // Handle navigation to details
  const handleViewDetails = useCallback((marker) => {
    if (currentType === 'tierheim') {
      navigate(`/tierheim/${marker.placeId}`);
    } else {
      // For other types, could open Google Maps or custom detail page
      window.open(`https://www.google.com/maps/place/?q=place_id:${marker.placeId}`, '_blank');
    }
  }, [currentType, navigate]);

  // Handle type change
  const handleTypeChange = useCallback((newType) => {
    setCurrentType(newType);
    setMarkers([]);
    setSelectedMarker(null);
    setError(null);
    setSearchStats(null);
  }, []);

  // Error display component
  const ErrorDisplay = ({ error }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <div className="flex items-center">
        <span className="text-red-500 mr-2">⚠️</span>
        <span className="font-medium">
          {error.type === 'api' ? 'API Configuration Error' : 
           error.type === 'location' ? 'Location Error' : 
           error.type === 'no_results' ? 'No Results' : 'Search Error'}
        </span>
      </div>
      <p className="mt-1 text-sm">{error.message}</p>
      {error.type === 'api' && (
        <div className="mt-2 text-xs">
          <p>Please check:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Google Cloud Console API key configuration</li>
            <li>Maps JavaScript API and Places API are enabled</li>
            <li>Billing account is set up</li>
            <li>API restrictions allow your domain</li>
          </ul>
        </div>
      )}
    </div>
  );

  // Loading states
  if (loadError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">❌</span>
          <span className="font-medium">Google Maps Failed to Load</span>
        </div>
        <p className="mt-1 text-sm">Please check your API key configuration and internet connection.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  const currentConfig = LOCATION_TYPES[currentType];

  return (
    <section className={`py-12 ${className}`}>
      <div className="max-w-7xl mx-auto text-center">
        <h3 className="text-2xl font-bold text-white mb-6">
          {currentConfig.icon} {currentConfig.label} Near You
        </h3>

        {/* Error Display */}
        {error && <ErrorDisplay error={error} />}

        {/* Search Stats */}
        {showStats && searchStats && !error && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="block font-semibold">{searchStats.total}</span>
                <span className="text-gray-300">Found</span>
              </div>
              <div>
                <span className="block font-semibold">{searchStats.searchRadius}km</span>
                <span className="text-gray-300">Radius</span>
              </div>
              <div>
                <span className="block font-semibold">{searchStats.averageDistance}km</span>
                <span className="text-gray-300">Avg Distance</span>
              </div>
              <div>
                <span className="block font-semibold">{currentConfig.label}</span>
                <span className="text-gray-300">Type</span>
              </div>
            </div>
          </div>
        )}

        {/* Type Selector */}
        {showTypeSelector && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {Object.entries(LOCATION_TYPES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentType === key 
                    ? `${config.bgColor} text-white` 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        )}

        {/* Map Container */}
        <div className={`${height} rounded-lg overflow-hidden shadow-lg mb-6`}>
          <GoogleMap
            mapContainerStyle={MAP_CONFIG.containerStyle}
            center={center}
            zoom={12}
            options={mapOptions}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%234F46E5' stroke='white' stroke-width='2'/%3E%3C/svg%3E",
                  scaledSize: new window.google.maps.Size(20, 20),
                }}
                title="Your Location"
              />
            )}

            {/* Location markers */}
            {markers.map((marker, index) => (
              <Marker
                key={`${marker.placeId}-${index}`}
                position={marker.position}
                onClick={() => handleMarkerClick(marker)}
                icon={{
                  url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Ccircle cx='15' cy='15' r='12' fill='${encodeURIComponent(currentConfig.color)}' stroke='white' stroke-width='2'/%3E%3Ctext x='15' y='20' text-anchor='middle' fill='white' font-size='16'%3E${currentConfig.icon}%3C/text%3E%3C/svg%3E`,
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
                title={marker.name}
              />
            ))}

            {/* Enhanced InfoWindow */}
            {selectedMarker && (
              <InfoWindow
                position={selectedMarker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="max-w-xs text-gray-800">
                  <h4 className="font-bold text-lg mb-2">{selectedMarker.name}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <p className="flex items-start">
                      <span className="mr-2">📍</span>
                      {selectedMarker.address}
                    </p>
                    
                    <p className="flex items-center">
                      <span className="mr-2">📏</span>
                      {selectedMarker.distance}km away
                    </p>

                    {selectedMarker.rating && (
                      <p className="flex items-center">
                        <span className="mr-2">⭐</span>
                        {selectedMarker.rating}/5 ({selectedMarker.userRatingsTotal} reviews)
                      </p>
                    )}

                    {selectedMarker.openingHours && (
                      <p className="flex items-center">
                        <span className="mr-2">🕒</span>
                        {selectedMarker.openingHours.isOpen() ? (
                          <span className="text-green-600">Open now</span>
                        ) : (
                          <span className="text-red-600">Closed</span>
                        )}
                      </p>
                    )}

                    {selectedMarker.phoneNumber && (
                      <p className="flex items-center">
                        <span className="mr-2">📞</span>
                        <a href={`tel:${selectedMarker.phoneNumber}`} className="text-blue-600 hover:underline">
                          {selectedMarker.phoneNumber}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewDetails(selectedMarker)}
                      className={`${currentConfig.bgColor} text-white px-3 py-1 rounded text-sm font-medium hover:opacity-90 transition-opacity`}
                    >
                      View Details
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.position.lat},${selectedMarker.position.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* Search Button */}
        <button
          onClick={() => searchLocations(currentType)}
          disabled={loading}
          className={`${currentConfig.bgColor} text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 ${
            loading ? 'animate-pulse' : ''
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Searching...
            </span>
          ) : (
            currentConfig.buttonText
          )}
        </button>

        {/* Results Summary */}
        {markers.length > 0 && !loading && (
          <div className="mt-6 text-gray-300 text-sm">
            <p>Found {markers.length} {currentConfig.label.toLowerCase()} near you</p>
            <p>Closest: {markers[0]?.name} ({markers[0]?.distance}km away)</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LocationServicesMap;