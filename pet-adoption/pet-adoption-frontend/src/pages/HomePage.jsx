import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getAllPets } from "../services/PostServicesPets";
import LocationServicesMap from "../components/LocationServicesMap";
import { AuthContext } from "../context/AuthProvider";
import Footer from "../components/Footer";
import PetCard from "../components/PetCard";

/**
 * HomePage Component - Enhanced with enterprise improvements
 * Maintains compatibility with existing components
 */
const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  
  const { user } = useContext(AuthContext);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  // Hero images with better organization
  const heroImages = useMemo(() => [
    {
      url: "https://www.parade.pet/assets/images/seasons/spring/pet/facebook.jpg",
      alt: "Happy pets in spring garden"
    },
    {
      url: "https://c.wallhere.com/photos/31/cb/dog_pet_animals_nature_plants_lake_green_relaxing-1521209.jpg!d",
      alt: "Dog by peaceful lake"
    },
    {
      url: "https://www.thefarmersdog.com/digest/wp-content/uploads/2021/06/cat-and-dog-top.jpg",
      alt: "Cat and dog together"
    },
    {
      url: "https://wallup.net/wp-content/uploads/2016/01/198138-animals-cat-dog.jpg",
      alt: "Pet portrait"
    },
    {
      url: "https://wallpapercave.com/wp/wp2544107.jpg",
      alt: "Multiple pets outdoors"
    }
  ], []);

  // Memoized filtered pets for better performance
  const filteredPets = useMemo(() => {
    if (!searchTerm.trim()) return pets;
    
    const searchLower = searchTerm.toLowerCase();
    return pets.filter((pet) => {
      if (!pet) return false;
      
      return (
        pet.name?.toLowerCase().includes(searchLower) ||
        pet.breed?.toLowerCase().includes(searchLower) ||
        pet.type?.toLowerCase().includes(searchLower) ||
        pet.age?.toString().includes(searchTerm)
      );
    });
  }, [pets, searchTerm]);

  // Enhanced fetch with error handling
  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const petsData = await getAllPets();
      
      if (Array.isArray(petsData)) {
        setPets(petsData);
      } else {
        throw new Error('Invalid data received');
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      setError('Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Image rotation with cleanup
  const nextImage = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      setIsFading(false);
    }, 300);
  }, [heroImages.length]);

  // Carousel scroll function
  const scrollCarousel = useCallback((direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ 
        left: scrollAmount, 
        behavior: 'smooth' 
      });
    }
  }, []);

  // Effects with proper cleanup
  useEffect(() => {
    setFadeIn(true);
    fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    intervalRef.current = setInterval(nextImage, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nextImage]);

  // Simple loading component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="space-y-12 mt-20">
      {/* Enhanced Header Section */}
      <section className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`w-full h-full absolute top-0 left-0 transition-opacity duration-1000 ease-in-out ${
                currentImageIndex === index ? (isFading ? "opacity-0" : "opacity-100") : "opacity-0"
              }`}
              style={{
                backgroundImage: `url("${image.url}")`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
          ))}
        </div>

        {/* Enhanced Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Your New Best Friend Awaits at{" "}
            <span className="text-green-400">Pawsome Homes</span>
          </h1>
          <p className="text-lg md:text-xl text-white mb-8 opacity-90 max-w-2xl mx-auto">
            Discover loving pets looking for their forever homes. 
            Every adoption saves a life and brings joy to your family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/pet-list"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Browse All Pets
            </Link>
            {!user && (
              <Link 
                to="/register"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => {
            setCurrentImageIndex(prev => 
              prev === 0 ? heroImages.length - 1 : prev - 1
            );
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-300"
          aria-label="Previous image"
        >
          <FaChevronLeft />
        </button>
        
        <button
          onClick={() => {
            setCurrentImageIndex(prev => (prev + 1) % heroImages.length);
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-300"
          aria-label="Next image"
        >
          <FaChevronRight />
        </button>

        {/* Image Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentImageIndex === index ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Enhanced Search Section */}
      <section id="search-pets" className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Find Your Perfect Match</h2>
          <p className="text-gray-300 text-lg">Search through our available pets</p>
        </div>
        
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search by pet name, breed, type, or age..."
            className="w-full p-4 pl-12 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 transition-all duration-300 shadow-sm focus:shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        
        {searchTerm && (
          <p className="text-center mt-4 text-gray-300">
            Found {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        )}
      </section>

      {/* Enhanced Pets Carousel */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {searchTerm ? 'Search Results' : 'Featured Pets'}
            </h2>
            <p className="text-gray-300">
              {filteredPets.length > 0 
                ? `${filteredPets.length} amazing pets looking for homes`
                : 'No pets found'
              }
            </p>
          </div>
          {!searchTerm && filteredPets.length > 8 && (
            <Link 
              to="/pet-list" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              View All
            </Link>
          )}
        </div>

        {loading && <LoadingSpinner />}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
            <button 
              onClick={fetchPets}
              className="ml-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && filteredPets.length > 0 && (
          <div className="relative">
            <button
              onClick={() => scrollCarousel('left')}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg z-10 transition-colors"
              aria-label="Scroll left"
            >
              <FaChevronLeft />
            </button>

            <div 
              ref={carouselRef} 
              className="flex overflow-x-auto scroll-smooth gap-6 pb-4 px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredPets.map((pet) => (
                <div key={pet._id} className="flex-shrink-0 w-80">
                  <PetCard pet={pet} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollCarousel('right')}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg z-10 transition-colors"
              aria-label="Scroll right"
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        {!loading && filteredPets.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {searchTerm ? 'No pets found' : 'No pets available right now'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Check back soon for new arrivals!'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </section>

      {/* Enhanced Interactive Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto text-white px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Find the Perfect Match for Your Lifestyle
          </h2>
          
          <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-16 text-center">
            <div className="w-full md:w-1/2 flex flex-col items-center space-y-4">
              <h3 className="text-2xl font-bold">Which Pet is Right for You?</h3>
              <div
                className="w-full h-64 bg-cover bg-center rounded-lg shadow-lg"
                style={{
                  backgroundImage: `url('https://petstrainingandboarding.com.au/wp-content/uploads/2016/05/choosing-the-right-pup-1.jpg')`,
                }}
              ></div>
              <p className="text-gray-300 mb-4">
                Take our quiz to find your perfect companion
              </p>
              <Link to="/quiz">
                <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                  Take the Quiz
                </button>
              </Link>
            </div>

            <div className="w-full md:w-1/2 flex flex-col items-center space-y-4">
              <h3 className="text-2xl font-bold">Essential Pet Supplies</h3>
              <div
                className="w-full h-64 bg-cover bg-center rounded-lg shadow-lg"
                style={{
                  backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEHUiMKXrqszd7ate582QcsgQAfLaVfoZ3Gw&s')`,
                }}
              ></div>
              <p className="text-gray-300 mb-4">
                Get recommendations for your new friend
              </p>
              <Link to="/suggested-items">
                <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                  Browse Supplies
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section - Updated with new unified component */}
      <LocationServicesMap 
        initialType="tierheim"
        height="h-72"
        showTypeSelector={false}
        showStats={true}
        className="bg-gray-700"
      />

      {/* Enhanced Nutrition Section */}
      <section className="py-16 text-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Nutrition That Nourishes</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Give your new companion the best nutrition with personalized recommendations.
          </p>
          
          <div
            className="w-full max-w-4xl mx-auto h-80 bg-center rounded-xl shadow-2xl mb-8"
            style={{
              backgroundImage: "url('https://as1.ftcdn.net/v2/jpg/08/13/28/18/1000_F_813281821_ljnOcqB3P5ddBcl3YR4xcZrx3vi9FswC.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          ></div>
          
          <Link to="/food-recommendation">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
              Get Nutrition Guide
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
