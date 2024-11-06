import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

// Container style for the map
const containerStyle = {
  width: '100%',
  height: '100%',
};

// Default center for the map
const defaultCenter = {
  lat: 51.1657, // Latitude for Germany
  lng: 10.4515, // Longitude for Germany
};

// Move the libraries array outside the component
const libraries = ['places'];

const AdoptionCentersMap = () => {
  const [center, setCenter] = useState(defaultCenter); // Center of the map
  const [markers, setMarkers] = useState([]); // Markers for adoption centers
  const [selectedMarker, setSelectedMarker] = useState(null); // To track the selected marker for the info window
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate(); // Initialize useNavigate

  // Use the useLoadScript hook to load the Google Maps script and Places library
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // Access the API key from the environment variable
    libraries: libraries, // Use the declared libraries array
  });

  // Function to find adoption centers using the Google Places API
  const handleFindAdoptionCenters = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCenter({ lat, lng });

        setLoading(true);

        if (window.google && window.google.maps) {
          const map = new window.google.maps.Map(document.createElement('div'));
          const service = new window.google.maps.places.PlacesService(map);

          const request = {
            location: { lat, lng },
            radius: '10000', // 10 km radius
            keyword: 'tierheim',
          };
          
          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              const newMarkers = results.map((place) => ({
                position: place.geometry.location,
                name: place.name,
                address: place.vicinity,
                placeId: place.place_id,
              }));
              setMarkers(newMarkers);
            } else {
              alert('No adoption centers found nearby.');
            }
            setLoading(false);
          });
        } else {
          console.error('Google Maps not available');
        }
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Extract the lat/lng for InfoWindow positioning
  const getPositionForInfoWindow = (position) => {
    return { lat: position.lat(), lng: position.lng() }; // Call the lat() and lng() functions to extract the values
  };

  // Show loading message if the Google Maps script hasn't loaded yet
  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading Google Maps...</div>;
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl text-white mx-auto text-center">
        <h3 className="text-2xl font-bold">Adoption Centers Near You</h3>
        <div className="h-64 mt-6 rounded-lg overflow-hidden">
          {isLoaded && (
            <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
              {markers.map((marker, index) => (
                <Marker
                  key={index}
                  position={marker.position}
                  onClick={() => {
                    console.log('Marker clicked:', marker);
                    setSelectedMarker(marker); // Open InfoWindow when clicked
                  }}
                />
              ))}

              {/* Show InfoWindow when a marker is selected */}
              {selectedMarker && selectedMarker.name && selectedMarker.address && (
                <InfoWindow
                  position={getPositionForInfoWindow(selectedMarker.position)} // Extract lat/lng values
                  onCloseClick={() => setSelectedMarker(null)} // Close the InfoWindow
                >
                  <div style={{ color: 'black' }}>
                    <h4>{selectedMarker.name}</h4>
                    <p>{selectedMarker.address}</p>
                    <button className='text-blue-900 font-bold'
                      onClick={() => {
                        console.log('Navigating to:', selectedMarker.placeId);
                        navigate(`/tierheim/${selectedMarker.placeId}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
        <button onClick={handleFindAdoptionCenters} className="btn btn-success mt-4" disabled={loading}>
          {loading ? 'Finding centers...' : 'Find Out Now!'}
        </button>
      </div>
    </section>
  );
};

export default AdoptionCentersMap;
