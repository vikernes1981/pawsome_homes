import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '/logo.svg';

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (decodedToken.role === 'Admin') {
          setIsAdmin(true);
          setIsAuthenticated(true);
          return true;
        }
        setIsAuthenticated(true);
        return true;
      }
      return false;
    };

    const intervalId = setInterval(() => {
      if (checkAuthStatus()) {
        clearInterval(intervalId);
      }
    }, 20);

    return () => clearInterval(intervalId);
  }, []);

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleMenuItemClick = () => {
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setIsAdmin(false);
    handleMenuItemClick();
  };

  return (
    <nav className="navbar bg-base-100 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center flex-1">
        {/* Logo on the left side */}
        <img src={logo} alt="Pawsome Homes Logo" className="h-24 w-26 mr-2" />

        <Link to="/" className="text-3xl text-white font-bold">Pawsome Homes</Link>
      </div>

      {/* Right-side navigation */}
      <div className="hidden md:flex text-white flex-none">
  <ul className="menu menu-horizontal p-0 text-lg"> {/* Adjust text size here */}
    <li><Link to="/">Home</Link></li>
    <li><Link to="/about">About Us</Link></li>
    <li><Link to="/contact">Contact Us</Link></li>
    {isAuthenticated ? (
      <li><Link to="/" onClick={handleLogout}>Logout</Link></li>
    ) : (
      <li><Link to="/login">Login</Link></li>
    )}
    {isAdmin && (
      <li><Link to="/admin">Admin Dashboard</Link></li>
    )}
  </ul>
</div>


      {/* Dropdown for mobile */}
      <div className="dropdown dropdown-end md:hidden">
        <label
          tabIndex={0}
          className="btn btn-square btn-ghost"
          onClick={handleDropdownToggle}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>
        {dropdownOpen && (
          <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 text-white rounded-box w-52">
            <li><Link to="/" onClick={handleMenuItemClick}>Home</Link></li>
            <li><Link to="/about" onClick={handleMenuItemClick}>About Us</Link></li>
            <li><Link to="/contact" onClick={handleMenuItemClick}>Contact Us</Link></li>
            {isAuthenticated ? (
              <li><Link to="/" onClick={handleLogout}>Logout</Link></li>
            ) : (
              <li><Link to="/login" onClick={handleMenuItemClick}>Login</Link></li>
            )}
            {isAdmin && (
              <li><Link to="/admin" onClick={handleMenuItemClick}>Admin Dashboard</Link></li>
            )}
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
