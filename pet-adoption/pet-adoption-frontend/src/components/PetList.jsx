import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import PetCard from '../components/PetCard';

const PetList = () => {
  // State management
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [petsPerPage] = useState(12);
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    breed: '',
    age: '',
    size: '',
    location: '',
    gender: '',
    status: 'available'
  });
  
  // Sorting
  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch pets data
  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await axios.get(`${API_URL}/api/pets`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Ensure data is an array
      const petsArray = Array.isArray(data) ? data : data.pets || [];
      setPets(petsArray);
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching pets:', err);
      
      let errorMessage = 'Failed to load pets';
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please check your connection.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Pet database not found.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Initial fetch
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Count active filters
  useEffect(() => {
    const count = Object.values(filters).filter(value => 
      value !== '' && value !== 'available'
    ).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Filter and sort pets
  const processedPets = useMemo(() => {
    let result = [...pets];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(pet => 
        pet.name?.toLowerCase().includes(searchLower) ||
        pet.breed?.toLowerCase().includes(searchLower) ||
        pet.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type) {
      result = result.filter(pet => 
        pet.type?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.breed) {
      result = result.filter(pet => 
        pet.breed?.toLowerCase().includes(filters.breed.toLowerCase())
      );
    }

    if (filters.age) {
      result = result.filter(pet => {
        const petAge = parseInt(pet.age);
        switch (filters.age) {
          case 'young': return petAge <= 2;
          case 'adult': return petAge > 2 && petAge <= 7;
          case 'senior': return petAge > 7;
          default: return true;
        }
      });
    }

    if (filters.size) {
      result = result.filter(pet => 
        pet.size?.toLowerCase() === filters.size.toLowerCase()
      );
    }

    if (filters.location) {
      result = result.filter(pet => 
        pet.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.gender) {
      result = result.filter(pet => 
        pet.gender?.toLowerCase() === filters.gender.toLowerCase()
      );
    }

    if (filters.status) {
      result = result.filter(pet => 
        pet.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'age':
          aValue = parseInt(a.age) || 0;
          bValue = parseInt(b.age) || 0;
          break;
        case 'breed':
          aValue = a.breed?.toLowerCase() || '';
          bValue = b.breed?.toLowerCase() || '';
          break;
        case 'newest':
          aValue = new Date(a.createdAt || a.dateAdded || 0);
          bValue = new Date(b.createdAt || b.dateAdded || 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [pets, filters, sortBy, sortOrder]);

  // Update filtered pets when processed pets change
  useEffect(() => {
    setFilteredPets(processedPets);
    setCurrentPage(1); // Reset to first page when filters change
  }, [processedPets]);

  // Pagination calculations
  const indexOfLastPet = currentPage * petsPerPage;
  const indexOfFirstPet = indexOfLastPet - petsPerPage;
  const currentPets = filteredPets.slice(indexOfFirstPet, indexOfLastPet);
  const totalPages = Math.ceil(filteredPets.length / petsPerPage);

  // Filter handlers
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      type: '',
      breed: '',
      age: '',
      size: '',
      location: '',
      gender: '',
      status: 'available'
    });
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Retry mechanism
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchPets();
  }, [fetchPets]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading Our Adorable Pets</h2>
          <p className="text-gray-500">Fetching the latest available companions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-4xl text-red-500 mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Pets</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              <span className="mr-2">🔄</span>
              {loading ? 'Retrying...' : `Try Again ${retryCount > 0 ? `(${retryCount})` : ''}`}
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Find Your Perfect Companion
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            {filteredPets.length} adorable pets waiting for their forever homes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          
          {/* Main Search Bar */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
            <input
              type="text"
              placeholder="Search by name, breed, or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-20 transition-all"
            />
          </div>

          {/* Filter Toggle and Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">🔽</span>
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <span className="mr-2">✕</span>
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="Grid View"
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                  title="List View"
                >
                  ☰
                </button>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="name">Name</option>
                  <option value="age">Age</option>
                  <option value="breed">Breed</option>
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">All Types</option>
                <option value="dog">🐕 Dogs</option>
                <option value="cat">🐱 Cats</option>
                <option value="bird">🦜 Birds</option>
                <option value="rabbit">🐰 Rabbits</option>
                <option value="other">🐾 Other</option>
              </select>

              <select
                value={filters.age}
                onChange={(e) => handleFilterChange('age', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">All Ages</option>
                <option value="young">👶 Young (0-2 years)</option>
                <option value="adult">🧑 Adult (3-7 years)</option>
                <option value="senior">👴 Senior (8+ years)</option>
              </select>

              <select
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">All Sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>

              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="">All Genders</option>
                <option value="male">♂️ Male</option>
                <option value="female">♀️ Female</option>
              </select>

              <input
                type="text"
                placeholder="📍 Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />

              <input
                type="text"
                placeholder="🐕 Breed"
                value={filters.breed}
                onChange={(e) => handleFilterChange('breed', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="available">✅ Available</option>
                <option value="pending">⏳ Pending Adoption</option>
                <option value="adopted">❤️ Adopted</option>
              </select>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-600">
            Showing {indexOfFirstPet + 1}-{Math.min(indexOfLastPet, filteredPets.length)} of {filteredPets.length} pets
          </div>
          {filteredPets.length > 0 && (
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* No Results */}
        {filteredPets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl text-gray-300 mb-6">🐾</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">No Pets Found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or filters to find more pets.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Pet Grid/List */}
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
            } mb-8`}>
              {currentPets.map((pet) => (
                <PetCard key={pet._id} pet={pet} viewMode={viewMode} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-3 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                  }`}
                >
                  ←
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === currentPage;
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 2;

                  if (!showPage) {
                    if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isCurrentPage
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-3 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                  }`}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PetList;