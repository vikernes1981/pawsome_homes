import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { getAllPets } from "../services/PostServicesPets";
import AdoptionCentersMap from "./AdoptionCentersMap";
import { AuthContext } from "../context/AuthProvider";
import Footer from "../components/Footer";
import PetCard from "../components/PetCard";

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePets, setVisiblePets] = useState(8);
  const [fadeIn, setFadeIn] = useState(false);
  const [pets, setPets] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const { token } = useContext(AuthContext);
  const carouselRef = useRef(null);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  useEffect(() => {
    const fetchPets = async () => {
      const petsData = await getAllPets();
      setPets(petsData);
    };
    fetchPets();
  }, []);

  const filteredPets = pets.filter(
    (pet) =>
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.age.toString().includes(searchTerm)
  );

  const loadMorePets = () => {
    setVisiblePets((prev) => prev + 8);
  };

  const images = [
    "https://www.parade.pet/assets/images/seasons/spring/pet/facebook.jpg",
    "https://c.wallhere.com/photos/31/cb/dog_pet_animals_nature_plants_lake_green_relaxing-1521209.jpg!d",
    "https://www.thefarmersdog.com/digest/wp-content/uploads/2021/06/cat-and-dog-top.jpg",
    "https://wallup.net/wp-content/uploads/2016/01/198138-animals-cat-dog.jpg",
    "https://wallpapercave.com/wp/wp2544107.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsFading(false);
      }, 0);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="space-y-12 mt-20">
      {/* Header Section */}
      <section className="relative min-h-[300px] md:min-h-[450px] lg:min-h-[550px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          {images.map((image, index) => (
            <div
              key={index}
              className={`w-full h-full absolute top-0 left-0 transition-opacity duration-1000 ease-in-out ${
                currentImageIndex === index ? (isFading ? "opacity-0" : "opacity-100") : "opacity-0"
              }`}
              style={{
                backgroundImage: `url("${image}")`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
          ))}
        </div>
        <h1 className="relative text-2xl md:text-4xl lg:text-5xl font-bold text-white z-10 text-center px-4">
          Your New Best Friend Awaits at Pawsome Homes
        </h1>
      </section>

      {/* Search */}
      <section id="adopt-pet-section" className="max-w-7xl mx-auto px-4 mt-6 animate-slideDown">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by pet name or breed..."
            className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 transition duration-300 ease-in-out shadow-sm focus:shadow-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </section>

      {/* Carousel */}
      <section className="max-w-7xl mx-auto px-4 mt-8 relative">
        <h2 className="text-2xl font-bold text-white mb-6">All Entries</h2>
        <div className="relative flex items-center overflow-hidden">
          <button
            onClick={() => carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' })}
            className="absolute left-0 bg-green-600 text-white rounded-full p-2 shadow-lg z-10"
          >
            ❮
          </button>

          <div ref={carouselRef} className="carousel-items flex items-center overflow-x-auto scroll-smooth">
            {filteredPets.map((pet) => (
              <div key={pet._id} className="flex-shrink-0 w-72 h-80 mx-2">
                <PetCard pet={pet} />
              </div>
            ))}
          </div>

          <button
            onClick={() => carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' })}
            className="absolute right-0 bg-green-600 text-white rounded-full p-2 shadow-lg z-10"
          >
            ❯
          </button>
        </div>
      </section>

      {/* Pet Quiz & Suggested Items */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto text-white flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-16 text-center">
          <div className="w-full md:w-1/2 flex flex-col items-center space-y-4">
            <h3 className="text-2xl font-bold">Which Pet is Right for You?</h3>
            <div
              className="w-full h-64 bg-cover bg-center rounded-lg shadow-lg"
              style={{
                backgroundImage: `url('https://petstrainingandboarding.com.au/wp-content/uploads/2016/05/choosing-the-right-pup-1.jpg')`,
              }}
            ></div>
            <Link to="/quiz">
              <button className="btn btn-success transition duration-500 ease-in-out transform hover:scale-105 mt-4">
                Find Out Now!
              </button>
            </Link>
          </div>

          <div className="w-full md:w-1/2 flex flex-col items-center space-y-4">
            <h3 className="text-2xl font-bold">Suggested items to buy for your new friend</h3>
            <div
              className="w-full h-64 bg-cover bg-center rounded-lg shadow-lg"
              style={{
                backgroundImage: `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEHUiMKXrqszd7ate582QcsgQAfLaVfoZ3Gw&s')`,
              }}
            ></div>
            <Link to="/suggested-items">
              <button className="btn btn-success transition duration-500 ease-in-out transform hover:scale-105 mt-4">
                Find Out Now!
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <AdoptionCentersMap />

      {/* Food Promo Section */}
      <section className="py-12 text-white text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center space-y-4">
          <h3 className="text-2xl font-bold">The Right Food for Your Pets!</h3>
          <div
            className="w-full h-96 bg-center rounded-lg shadow-lg"
            style={{
              backgroundImage: "url('https://as1.ftcdn.net/v2/jpg/08/13/28/18/1000_F_813281821_ljnOcqB3P5ddBcl3YR4xcZrx3vi9FswC.jpg')",
              backgroundSize: "auto 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center"
            }}
          ></div>
          <Link to="/food-recommendation">
            <button className="btn btn-success mt-4 transition duration-500 ease-in-out transform hover:scale-105">
              Find Out Now!
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
