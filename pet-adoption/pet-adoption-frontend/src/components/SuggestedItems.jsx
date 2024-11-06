import React from 'react';

const SuggestedItems = () => {
  const items = [
    { 
      name: 'Food and Water Bowls', 
      description: 'Durable, non-slip bowls for food and water.',
      image: 'https://n2.sdlcdn.com/imgs/g/6/j/Petshop7-Stylish-Regular-Anti-Skid-SDL291202636-1-d0373.jpeg',
      link: 'https://www.amazon.com/s?k=food+and+water+bowls' 
    },
    { 
      name: 'High-Quality Pet Food', 
      description: 'Nutritious food that meets your pet’s dietary needs.',
      image: 'http://bfs-group.eu/wp/wp-content/uploads/Petfood.jpg',
      link: 'https://www.amazon.com/s?k=high+quality+pet+food'
    },
    { 
      name: 'Leash and Collar', 
      description: 'Secure, comfortable leash and collar for safe walks.',
      image: 'http://cdn.shopify.com/s/files/1/0005/5191/1490/products/product-image-781856036_1200x1200.jpg?v=1553682632',
      link: 'https://www.amazon.com/s?k=leash+and+collar'
    },
    { 
      name: 'Bedding', 
      description: 'Soft, cozy bedding to make your pet feel at home.',
      image: 'https://assets.orvis.com/is/image/orvisprd/20FF0220FD_?wid=1200&src=is($object$:1-1)',
      link: 'https://www.amazon.com/s?k=pet+bedding'
    },
    { 
      name: 'Toys', 
      description: 'Engaging toys to keep your pet entertained and mentally stimulated.',
      image: 'https://www.thesprucepets.com/thmb/A7ELQvHR6ZCy2JQwMjjZD543Jqo=/960x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-11495316831-d3a68a67da3d4038b0d3b0d70bd01a84.jpg',
      link: 'https://www.amazon.com/s?k=pet+toys'
    },
    { 
      name: 'Grooming Supplies', 
      description: 'Essential grooming tools like brushes, nail clippers, and shampoo.',
      image: 'https://topdogtips.com/wp-content/uploads/2016/03/Top-Best-Cheap-Dog-Grooming-Supplies.jpg',
      link: 'https://www.amazon.com/s?k=grooming+supplies'
    },
    { 
      name: 'Pet Crate or Carrier', 
      description: 'A safe crate or carrier for easy transport and training.',
      image: 'https://maarcadopt.org/wp-content/uploads/2019/11/cat-crate-training2.jpg',
      link: 'https://www.amazon.com/s?k=pet+crate'
    },
  ];

  return (
    <div className="bg-gray-700 text-white py-20 px-4  rounded-lg shadow-lg text-center pt-18">
      <div className="flex justify-center mb-12">
        <img 
          src="https://cdn.mos.cms.futurecdn.net/NTHiJHD2tnCxZoL8cX3hBU-1024-80.jpg" 
          alt="Suggested Items"
          className="rounded-md h-80 w-[90%] object-cover mx-4" 
        />
      </div>
      <h2 className="text-3xl font-bold mb-6 underline decoration-emerald-400">
        Suggested Items to Buy Before Adopting a Pet
      </h2>
      <p className="mt-4 text-sm text-gray-300 mb-6">
        Please note that these suggestions are just recommendations. If you have a local pet shop, we strongly encourage you to support them by purchasing these items there.
      </p>
      <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-md">
        <p className="mb-6 text-md text-gray-300 leading-relaxed">
          Preparing your home for a new pet is crucial for ensuring a smooth transition and a happy environment. 
          Here are some reasons why these items are essential:
        </p>
        <div className="text-left">
          <ul className="list-disc space-y-4 text-gray-200">
            <li>
              <strong className="text-emerald-400">Toys:</strong> Engaging toys are vital for keeping your pet mentally stimulated and active. 
              They help prevent boredom and destructive behavior during the adjustment period.
            </li>
            <li>
              <strong className="text-emerald-400">Bedding:</strong> A comfortable bed provides your pet with a safe space to relax and sleep, making them feel more at home. 
              It’s important for their physical and emotional well-being.
            </li>
            <li>
              <strong className="text-emerald-400">Food and Water Bowls:</strong> Having sturdy bowls is necessary for feeding and hydrating your pet, ensuring they have what they need right from the start.
            </li>
            <li>
              <strong className="text-emerald-400">Leash and Collar:</strong> A good leash and collar are essential for safe walks and outings. 
              They also help establish boundaries and training routines.
            </li>
            <li>
              <strong className="text-emerald-400">Grooming Supplies:</strong> Regular grooming keeps your pet healthy and comfortable. It’s also a great bonding activity.
            </li>
            <li>
              <strong className="text-emerald-400">Pet Crate or Carrier:</strong> A crate is important for safe transport and can serve as a secure den for your pet when needed.
            </li>
          </ul>
        </div>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <li 
            key={index} 
            className="flex flex-col items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-600 transition-colors duration-300"
          >
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <img src={item.image} alt={item.name} className="h-32 w-32 object-cover mb-2 rounded-md shadow-md" />
            </a>
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-sm">{item.description}</p>
          </li>
        ))}
      </ul>

      <a
        href="https://www.amazon.de/s?k=pets+supplies&__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=1ZLS0JR1IPQCS&sprefix=pets+supplies%2Caps%2C111&ref=nb_sb_noss_2"
        target="_blank"
        rel="noopener noreferrer"
      >    
        <button className="btn btn-success mt-8 transition duration-500 ease-in-out transform hover:scale-105">
          Shop Now
        </button>
      </a>
    </div>
  );
};

export default SuggestedItems;
