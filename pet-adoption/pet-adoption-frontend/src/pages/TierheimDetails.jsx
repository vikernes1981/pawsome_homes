import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const MAX_PHOTO_WIDTH = 400;
const MAX_PHOTO_HEIGHT = 300;

const TierheimDetails = () => {
  const { placeId } = useParams();
  const [placeDetails, setPlaceDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        const request = {
          placeId,
          fields: ['name', 'formatted_phone_number', 'formatted_address', 'photos', 'website', 'rating'],
        };

        service.getDetails(request, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPlaceDetails(place);
          } else {
            console.error('Google Places error:', status);
            setError('Unable to load place details.');
          }
        });
      } catch (err) {
        console.error('Fetch error:', err);
        setError('An unexpected error occurred while loading details.');
      }
    };

    fetchPlaceDetails();
  }, [placeId]);

  if (error) {
    return <div className="text-red-500 text-center mt-20">{error}</div>;
  }

  if (!placeDetails) {
    return <div className="text-white text-center mt-20">Loading place details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-20 p-8 bg-gray-800 text-white rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row items-center">
        {placeDetails.photos && (
          <img
            className="w-full md:w-1/2 rounded-lg object-cover mb-4 md:mb-0 md:mr-6"
            src={placeDetails.photos[0].getUrl({ maxWidth: MAX_PHOTO_WIDTH, maxHeight: MAX_PHOTO_HEIGHT })}
            alt={placeDetails.name || 'Animal shelter'}
          />
        )}

        <div className="w-full md:w-1/2">
          <h1 className="text-3xl font-bold mb-3">{placeDetails.name || 'Unknown Shelter'}</h1>
          <p className="mb-2">
            <strong>Address:</strong>{' '}
            {placeDetails.formatted_address || <em>Not available</em>}
          </p>
          <p className="mb-2">
            <strong>Phone:</strong>{' '}
            {placeDetails.formatted_phone_number || <em>Not available</em>}
          </p>
          <p className="mb-2">
            <strong>Rating:</strong>{' '}
            {placeDetails.rating ? `${placeDetails.rating} / 5` : <em>No ratings</em>}
          </p>
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
              <em>Not available</em>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TierheimDetails;
