import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 51.1657,
  lng: 10.4515,
};

const libraries = ['places'];

const PetFoodMap = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const handleFindPetShop = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

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
          radius: '15000',
          keyword: 'pet supply stores',
        };

        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            const newMarkers = results.map((place) => ({
              position: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
              name: place.name,
              address: place.vicinity,
              placeId: place.place_id,
            }));
            setMarkers(newMarkers);
          } else {
            alert('No pet shops found nearby.');
          }
          setLoading(false);
        });
      } else {
        console.error('Google Maps API not available.');
        setLoading(false);
      }
    });
  };

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <section className="bg-gray-700 py-12">
      <div className="max-w-7xl text-white mx-auto text-center">
        <h3 className="text-2xl font-bold">Pet Shops Near You</h3>

        <div className="h-72 mt-6 rounded-lg overflow-hidden">
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
            {markers.map((marker, index) => (
              <Marker
                key={index}
                position={marker.position}
                onClick={() => setSelectedMarker(marker)}
              />
            ))}

            {selectedMarker && (
              <InfoWindow
                position={selectedMarker.position}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div style={{ color: 'black' }}>
                  <h4>{selectedMarker.name}</h4>
                  <p>{selectedMarker.address}</p>
                  <button
                    className="text-blue-900 font-bold"
                    onClick={() => navigate(`/tierheim/${selectedMarker.placeId}`)}
                  >
                    View Details
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        <button
          onClick={handleFindPetShop}
          className="btn btn-success mt-4"
          disabled={loading}
        >
          {loading ? 'Finding centers...' : 'Find Out Now!'}
        </button>
      </div>
    </section>
  );
};

export default PetFoodMap;
