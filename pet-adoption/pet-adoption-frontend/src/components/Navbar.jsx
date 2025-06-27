import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import { toast } from 'react-toastify';
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Home, 
  Info, 
  Mail,
  Heart,
  ChevronDown
} from 'lucide-react';
import logo from '/logo.svg';

/**
 * Enterprise-grade Navbar Component
 * Features: Proper auth state management, accessibility, responsive design, user profile dropdown
 */
const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Debug auth state
  useEffect(() => {
    console.log('Navbar - Auth State:', {
      user,
      isAuthenticated,
      userRole: user?.role,
      userEmail: user?.email
    });
  }, [user, isAuthenticated]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close menus on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const toggleUserMenu = () => setUserMenuOpen(prev => !prev);

  // Check if current route is active
  const isActiveRoute = (path) => location.pathname === path;

  // Navigation items
  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/pet-list', label: 'Browse Pets', icon: Heart },
    { path: '/about', label: 'About Us', icon: Info },
    { path: '/contact', label: 'Contact Us', icon: Mail },
  ];

  return (
    <nav className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg fixed top-0 left-0 right-0 z-50 border-b border-green-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link 
              to="/" 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              aria-label="Pawsome Homes - Go to homepage"
            >
              <img 
                src={logo} 
                alt="Pawsome Homes Logo" 
                className="h-12 w-12 rounded-full bg-white p-1 shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-2xl lg:text-3xl text-white font-bold tracking-tight">
                Pawsome Homes
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActiveRoute(item.path)
                      ? 'bg-white bg-opacity-20 text-white shadow-sm'
                      : 'text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }`}
                  aria-current={isActiveRoute(item.path) ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Admin Dashboard Link */}
                {['admin', 'super_admin'].includes(user.role) && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActiveRoute('/admin')
                        ? 'bg-white bg-opacity-20 text-white shadow-sm'
                        : 'text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                {/* User Profile Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 bg-white bg-opacity-10 hover:bg-opacity-20 px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-white">
                        {user.username || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-green-200">
                        {user.role || 'Member'}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-green-200 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.profile?.firstName && user.profile?.lastName 
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : user.username || 'User'
                          }
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile Settings
                      </Link>
                      
                      <Link
                        to="/my-applications"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        My Applications
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {loading ? 'Logging out...' : 'Sign Out'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Login/Register Buttons */
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-green-100 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="lg:hidden bg-green-700 bg-opacity-95 backdrop-blur-sm rounded-lg mt-2 mb-4 shadow-lg border border-green-500"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Navigation Items */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActiveRoute(item.path)
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Auth Section */}
              {isAuthenticated && user ? (
                <>
                  <div className="border-t border-green-600 my-4"></div>
                  
                  {/* User Info */}
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-white">
                      {user.username || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-green-200">{user.email}</p>
                  </div>

                  {/* Admin Dashboard */}
                  {(user.role === 'admin' || user.role === 'Admin') && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-5 h-5" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  {/* Profile */}
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-200 hover:bg-red-500 hover:bg-opacity-20 hover:text-red-100 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{loading ? 'Logging out...' : 'Sign Out'}</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-green-600 my-4"></div>
                  <Link
                    to="/login"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-green-100 hover:bg-white hover:bg-opacity-10 hover:text-white transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium bg-white text-green-700 hover:bg-green-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;