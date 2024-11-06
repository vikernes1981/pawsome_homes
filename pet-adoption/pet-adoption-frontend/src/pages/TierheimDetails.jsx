import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TierheimDetails = () => {
  const { placeId } = useParams(); // Get the placeId from the URL
  const [placeDetails, setPlaceDetails] = useState(null);

  useEffect(() => {
    // Function to fetch place details using Google Places API
    const fetchPlaceDetails = async () => {
      try {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        const request = {
          placeId: placeId,
          fields: ['name', 'formatted_phone_number', 'formatted_address', 'photos', 'website', 'rating'],
        };

        service.getDetails(request, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPlaceDetails(place);
          } else {
            console.error('Error fetching place details:', status);
          }
        });
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    };

    fetchPlaceDetails();
  }, [placeId]);

  if (!placeDetails) return <div className="text-white">Loading place details...</div>;

  return (
    <div className="max-w-3xl mx-auto mt-20 p-16 bg-gray-800 text-white rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row items-center">
        {/* Display the photo */}
        {placeDetails.photos && (
          <img
            className="w-full md:w-1/2 rounded-lg object-cover mb-4 md:mb-0 md:mr-6"
            src={placeDetails.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })}
            alt={placeDetails.name}
          />
        )}

        {/* Display the place information */}
        <div className="w-full md:w-1/2">
          <h1 className="text-3xl font-bold mb-2">{placeDetails.name}</h1>
          <p className="mb-2"><strong>Address:</strong> {placeDetails.formatted_address}</p>
          <p className="mb-2"><strong>Phone:</strong> {placeDetails.formatted_phone_number || 'N/A'}</p>
          <p className="mb-2"><strong>Rating:</strong> {placeDetails.rating || 'No ratings available'}</p>
          <p className="mb-2">
            <strong>Website:</strong>{' '}
            {placeDetails.website ? (
              <a
                href={placeDetails.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {placeDetails.website}
              </a>
            ) : (
              'No website available'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TierheimDetails;
