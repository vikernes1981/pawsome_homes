import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaShoppingCart, 
  FaHeart, 
  FaInfoCircle, 
  FaExternalLinkAlt, 
  FaFilter,
  FaStar,
  FaCheckCircle,
  FaPaw,
  FaStore,
  FaBoxOpen,
  FaTags
} from 'react-icons/fa';

const SuggestedItems = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showEducational, setShowEducational] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const items = useMemo(() => [
    { 
      id: 1,
      name: 'Premium Food & Water Bowls', 
      description: 'Stainless steel, non-slip bowls designed for durability and hygiene.',
      image: 'https://n2.sdlcdn.com/imgs/g/6/j/Petshop7-Stylish-Regular-Anti-Skid-SDL291202636-1-d0373.jpeg',
      category: 'feeding',
      priceRange: 'budget',
      priority: 'essential',
      benefits: ['Prevents bacteria buildup', 'Non-slip base', 'Easy to clean'],
      link: 'https://www.amazon.com/s?k=stainless+steel+pet+bowls',
      rating: 4.5,
      estimatedPrice: '$15-25'
    },
    { 
      id: 2,
      name: 'High-Quality Pet Food', 
      description: 'Premium nutrition tailored to your pet\'s age, size, and dietary requirements.',
      image: 'http://bfs-group.eu/wp/wp-content/uploads/Petfood.jpg',
      category: 'feeding',
      priceRange: 'mid',
      priority: 'essential',
      benefits: ['Balanced nutrition', 'Age-appropriate formula', 'Supports healthy growth'],
      link: 'https://www.amazon.com/s?k=premium+pet+food',
      rating: 4.7,
      estimatedPrice: '$30-60'
    },
    { 
      id: 3,
      name: 'Adjustable Leash & Collar Set', 
      description: 'Comfortable, secure leash and collar system for safe walks and training.',
      image: 'http://cdn.shopify.com/s/files/1/0005/5191/1490/products/product-image-781856036_1200x1200.jpg?v=1553682632',
      category: 'safety',
      priceRange: 'budget',
      priority: 'essential',
      benefits: ['Adjustable sizing', 'Reflective materials', 'Comfortable padding'],
      link: 'https://www.amazon.com/s?k=adjustable+pet+leash+collar',
      rating: 4.4,
      estimatedPrice: '$20-35'
    },
    { 
      id: 4,
      name: 'Orthopedic Pet Bed', 
      description: 'Memory foam bedding designed for optimal comfort and joint support.',
      image: 'https://assets.orvis.com/is/image/orvisprd/20FF0220FD_?wid=1200&src=is($object$:1-1)',
      category: 'comfort',
      priceRange: 'mid',
      priority: 'essential',
      benefits: ['Joint support', 'Machine washable', 'Temperature regulating'],
      link: 'https://www.amazon.com/s?k=orthopedic+pet+bed',
      rating: 4.6,
      estimatedPrice: '$40-80'
    },
    { 
      id: 5,
      name: 'Interactive Puzzle Toys', 
      description: 'Mental stimulation toys that challenge and entertain your pet.',
      image: 'https://www.thesprucepets.com/thmb/A7ELQvHR6ZCy2JQwMjjZD543Jqo=/960x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-11495316831-d3a68a67da3d4038b0d3b0d70bd01a84.jpg',
      category: 'entertainment',
      priceRange: 'budget',
      priority: 'recommended',
      benefits: ['Reduces anxiety', 'Prevents boredom', 'Encourages problem-solving'],
      link: 'https://www.amazon.com/s?k=interactive+pet+puzzle+toys',
      rating: 4.3,
      estimatedPrice: '$10-25'
    },
    { 
      id: 6,
      name: 'Professional Grooming Kit', 
      description: 'Complete grooming set with brushes, nail clippers, and gentle shampoo.',
      image: 'https://topdogtips.com/wp-content/uploads/2016/03/Top-Best-Cheap-Dog-Grooming-Supplies.jpg',
      category: 'health',
      priceRange: 'mid',
      priority: 'recommended',
      benefits: ['Promotes hygiene', 'Bonding activity', 'Professional quality tools'],
      link: 'https://www.amazon.com/s?k=professional+pet+grooming+kit',
      rating: 4.5,
      estimatedPrice: '$35-55'
    },
    { 
      id: 7,
      name: 'Travel-Safe Pet Carrier', 
      description: 'Airline-approved carrier for safe transport and training purposes.',
      image: 'https://maarcadopt.org/wp-content/uploads/2019/11/cat-crate-training2.jpg',
      category: 'safety',
      priceRange: 'premium',
      priority: 'essential',
      benefits: ['Airline approved', 'Secure ventilation', 'Easy assembly'],
      link: 'https://www.amazon.com/s?k=airline+approved+pet+carrier',
      rating: 4.4,
      estimatedPrice: '$60-120'
    },
    { 
      id: 8,
      name: 'Smart Pet Monitoring Camera', 
      description: 'Keep an eye on your pet while away with two-way audio communication.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      category: 'technology',
      priceRange: 'premium',
      priority: 'optional',
      benefits: ['Two-way audio', 'Mobile alerts', 'Night vision'],
      link: 'https://www.amazon.com/s?k=pet+monitoring+camera',
      rating: 4.2,
      estimatedPrice: '$80-150'
    }
  ], []);

  const categories = [
    { value: 'all', label: 'All Items', icon: <FaBoxOpen /> },
    { value: 'feeding', label: 'Feeding', icon: <FaPaw /> },
    { value: 'safety', label: 'Safety', icon: <FaCheckCircle /> },
    { value: 'comfort', label: 'Comfort', icon: <FaHeart /> },
    { value: 'entertainment', label: 'Entertainment', icon: <FaStar /> },
    { value: 'health', label: 'Health & Grooming', icon: <FaInfoCircle /> },
    { value: 'technology', label: 'Technology', icon: <FaTags /> }
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: 'budget', label: 'Budget ($10-30)' },
    { value: 'mid', label: 'Mid-range ($30-60)' },
    { value: 'premium', label: 'Premium ($60+)' }
  ];

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const priceMatch = priceRange === 'all' || item.priceRange === priceRange;
      return categoryMatch && priceMatch;
    });
  }, [items, selectedCategory, priceRange]);

  const essentialItems = filteredItems.filter(item => item.priority === 'essential');
  const recommendedItems = filteredItems.filter(item => item.priority === 'recommended');
  const optionalItems = filteredItems.filter(item => item.priority === 'optional');

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

  const ItemCard = ({ item }) => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Product+Image';
          }}
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.priority === 'essential' ? 'bg-red-100 text-red-800' :
            item.priority === 'recommended' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {item.priority === 'essential' ? 'Must Have' : 
             item.priority === 'recommended' ? 'Recommended' : 'Optional'}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-semibold text-gray-800">
            {item.estimatedPrice}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center mr-2">
            {renderStars(item.rating)}
          </div>
          <span className="text-sm text-gray-500">({item.rating}/5)</span>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Benefits:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {item.benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center group"
        >
          <FaShoppingCart className="mr-2" />
          Shop Now
          <FaExternalLinkAlt className="ml-2 text-xs group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
            <img 
              src="https://cdn.mos.cms.futurecdn.net/NTHiJHD2tnCxZoL8cX3hBU-1024-80.jpg" 
              alt="Pet supplies preparation"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-5xl font-bold mb-4">Pet Adoption Essentials</h1>
                <p className="text-xl opacity-90">Everything you need for your new best friend</p>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Section */}
        {showEducational && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Why These Items Are Essential</h2>
              <button
                onClick={() => setShowEducational(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <FaPaw className="text-3xl text-green-600" />,
                  title: "Smooth Transition",
                  description: "Having supplies ready helps your new pet feel at home immediately, reducing stress and anxiety."
                },
                {
                  icon: <FaHeart className="text-3xl text-red-500" />,
                  title: "Safety First",
                  description: "Proper equipment ensures your pet's safety during walks, travel, and daily activities."
                },
                {
                  icon: <FaStar className="text-3xl text-yellow-500" />,
                  title: "Healthy Development",
                  description: "Quality food, toys, and grooming supplies support your pet's physical and mental well-being."
                }
              ].map((benefit, index) => (
                <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                  <div className="flex justify-center mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border-l-4 border-blue-500">
              <div className="flex items-start">
                <FaStore className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Support Local Businesses</h4>
                  <p className="text-blue-700 text-sm">
                    These recommendations include online links for convenience, but we strongly encourage 
                    supporting your local pet stores when possible. They often provide personalized advice 
                    and build lasting relationships with pet owners in your community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center mb-4">
            <FaFilter className="text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Filter Products</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center ${
                      selectedCategory === category.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Essential Items */}
        {essentialItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Must-Have Essentials</h2>
            <p className="text-gray-600 mb-6">Critical items every new pet owner needs</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {essentialItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Items */}
        {recommendedItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Highly Recommended</h2>
            <p className="text-gray-600 mb-6">Items that greatly improve your pet's quality of life</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Optional Items */}
        {optionalItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Optional Extras</h2>
            <p className="text-gray-600 mb-6">Nice-to-have items for enhanced pet care</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {optionalItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Welcome Your New Friend?</h2>
          <p className="text-xl mb-8 opacity-90">
            Browse our available pets and find your perfect companion today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pet-list">
              <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center">
                <FaHeart className="mr-2" />
                Browse Available Pets
              </button>
            </Link>
            <a
              href="https://www.amazon.de/s?k=pets+supplies"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-colors flex items-center justify-center"
            >
              <FaShoppingCart className="mr-2" />
              Shop All Supplies
              <FaExternalLinkAlt className="ml-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestedItems;