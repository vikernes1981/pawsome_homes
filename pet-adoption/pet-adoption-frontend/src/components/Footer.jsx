import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaTwitter, FaEnvelope } from "react-icons/fa";
import logo from '/logo.svg'; // Import the logo

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-8 relative">
      <div className="max-w-7xl mx-auto px-4 md:flex md:justify-between text-sm relative z-10">
        
        {/* Left Section - Logo and Links */}
        <div className="mb-6 md:mb-0 md:mr-4">
          <h2 className="text-xl font-bold mb-2 text-green-500">Pawsome Homes</h2>
          <p className="mb-4 text-gray-400 text-base">Your one-stop place to find a new best friend!</p>
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base">Home</Link>
            <Link to="/about" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base">About Us</Link>
            <Link to="/contact" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base">Contact</Link>
            <a href="#adopt-pet-section" className="hover:underline text-gray-300 hover:text-white text-sm md:text-base">Adopt a Pet</a>
          </nav>
        </div>

        {/* Center Section - Contact */}
        <div className="mb-6 md:mb-0 md:mr-4">
          <h3 className="text-lg font-semibold mb-2 text-green-500">Contact Us</h3>
          <p className="text-gray-400 text-sm md:text-base">Email: <a href="mailto:info@pawsomehomes.com" className="hover:underline text-gray-300 hover:text-white">info@pawsomehomes.com</a></p>
          <p className="text-gray-400 text-sm md:text-base">Phone: +1 (234) 567-8900</p>
          <p className="text-gray-400 text-sm md:text-base">Address: 123 Pet Street, City, Country</p>
        </div>

        {/* Right Section - Social Media and Logo */}
        <div className="flex flex-col items-center md:items-end">
          <h3 className="text-lg font-semibold mb-2 text-green-500">Follow Us</h3>
          <div className="flex space-x-3 mb-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-2xl text-gray-300 hover:text-blue-500">
              <FaFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-2xl text-gray-300 hover:text-pink-500">
              <FaInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-2xl text-gray-300 hover:text-blue-400">
              <FaTwitter />
            </a>
            <a href="mailto:info@pawsomehomes.com" className="text-2xl text-gray-300 hover:text-gray-400">
              <FaEnvelope />
            </a>
          </div>
          {/* Logo Positioned on the Right */}
          <div className="flex justify-end">
            <img
              src={logo}
              alt="Pawsome Homes Logo"
              className="h-24 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Copyright */}
      <div className="text-center mt-6 border-t border-gray-700 pt-4 font-bold text-xs md:text-sm text-gray-400 relative z-10">
        <p>&copy; {new Date().getFullYear()} Pawsome Homes. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
