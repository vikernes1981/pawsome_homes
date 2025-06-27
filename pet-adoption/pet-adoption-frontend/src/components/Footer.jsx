import React from "react";
import { Link } from "react-router-dom";
import logo from '/logo.svg';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 relative">
      <div className="max-w-7xl mx-auto px-4 md:flex md:justify-between text-sm relative z-10">
        
        {/* Left Section - Logo and Links */}
        <div className="mb-6 md:mb-0 md:mr-4">
          <h2 className="text-xl font-bold mb-2 text-green-500">Pawsome Homes</h2>
          <p className="mb-4 text-gray-400 text-base">Your one-stop place to find a new best friend!</p>
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base transition-colors">
              🏠 Home
            </Link>
            <Link to="/about" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base transition-colors">
              ℹ️ About Us
            </Link>
            <Link to="/contact" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base transition-colors">
              📧 Contact
            </Link>
            <Link to="/pet-list" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base transition-colors">
              🐾 Adopt a Pet
            </Link>
          </nav>
        </div>

        {/* Center Section - Contact */}
        <div className="mb-6 md:mb-0 md:mr-4">
          <h3 className="text-lg font-semibold mb-2 text-green-500">Contact Us</h3>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm md:text-base flex items-center">
              <span className="mr-2">📧</span>
              <a href="mailto:info@pawsomehomes.com" className="hover:underline text-gray-300 hover:text-white transition-colors">
                info@pawsomehomes.com
              </a>
            </p>
            <p className="text-gray-400 text-sm md:text-base flex items-center">
              <span className="mr-2">📞</span>
              <a href="tel:+12345678900" className="hover:underline text-gray-300 hover:text-white transition-colors">
                +1 (234) 567-8900
              </a>
            </p>
            <p className="text-gray-400 text-sm md:text-base flex items-center">
              <span className="mr-2">📍</span>
              123 Pet Street, City, Country
            </p>
          </div>
        </div>

        {/* Right Section - Social Media and Logo */}
        <div className="flex flex-col items-center md:items-end">
          <h3 className="text-lg font-semibold mb-2 text-green-500">Follow Us</h3>
          <div className="flex space-x-4 mb-4">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-2xl text-gray-300 hover:text-blue-500 transition-colors transform hover:scale-110 duration-200"
              title="Follow us on Facebook"
            >
              📘
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-2xl text-gray-300 hover:text-pink-500 transition-colors transform hover:scale-110 duration-200"
              title="Follow us on Instagram"
            >
              📷
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-2xl text-gray-300 hover:text-blue-400 transition-colors transform hover:scale-110 duration-200"
              title="Follow us on Twitter"
            >
              🐦
            </a>
            <a 
              href="mailto:info@pawsomehomes.com" 
              className="text-2xl text-gray-300 hover:text-gray-400 transition-colors transform hover:scale-110 duration-200"
              title="Send us an email"
            >
              ✉️
            </a>
          </div>
          
          {/* Logo */}
          <div className="flex justify-end">
            <img
              src={logo}
              alt="Pawsome Homes Logo"
              className="h-24 w-auto opacity-80 hover:opacity-100 transition-opacity"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Copyright and Additional Links */}
      <div className="border-t border-gray-700 pt-6 mt-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Pawsome Homes. All rights reserved.
            </p>
            
            {/* Additional Footer Links */}
            <div className="flex space-x-4 text-xs md:text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/sitemap" className="text-gray-400 hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
          
          {/* Fun Pet Facts or Quote */}
          <div className="text-center mt-4 text-xs text-gray-500 italic">
            🐾 "Saving one animal won't change the world, but it will change the world for that one animal." 🐾
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;