import React from 'react';
import { Link } from 'react-router-dom';

const PetCard = ({ pet }) => {
  if (!pet) return null;

  return (
	<Link to={`/pets/${pet._id}`}>
	  <div className="relative shadow-lg rounded-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
		<img
		  src={pet.image}
		  alt={pet.name}
		  className="object-cover h-64 w-full transition-opacity duration-300 hover:opacity-90"
		  style={{ filter: 'brightness(1.1)' }}
		/>
		<div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-4">
		  <h2 className="text-xl font-bold text-white">
			{pet.name} - {pet.breed}
		  </h2>
		</div>
	  </div>
	</Link>
  );
};

export default PetCard;
