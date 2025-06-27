import axios from 'axios';

/**
 * Enterprise-grade Pet Service
 * Handles all pet-related API operations with authentication, error handling, and logging
 */

// Configuration
const BASE_URL = `${import.meta.env.VITE_API_URL}/api/pets`;
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

// Create axios instance with default configuration
const petApi = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authentication and logging
petApi.interceptors.request.use(
  (config) => {
    // Add authentication token - using the correct key from AuthProvider
    const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    // Log request (remove in production)
    console.log(`[Pet API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
      hasToken: !!token,
      headers: config.headers
    });

    return config;
  },
  (error) => {
    console.error('[Pet API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
petApi.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const endTime = new Date();
    const duration = endTime.getTime() - response.config.metadata.startTime.getTime();
    
    // Log successful response
    console.log(`[Pet API] Response received in ${duration}ms:`, {
      status: response.status,
      data: response.data,
      url: response.config.url
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error details
    console.error('[Pet API] Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: originalRequest?.url,
      method: originalRequest?.method
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('[Pet API] Authentication failed - token may be invalid or expired');
      
      // Clear invalid token - using the correct key from AuthProvider
      localStorage.removeItem('authToken'); // Changed from 'token' to 'authToken'
      
      // Don't force redirect - let React Router and AuthProvider handle navigation
      // This prevents conflicts with existing authentication state management
      return Promise.reject(new Error('Authentication required. Please log in again.'));
    }

    // Handle network errors with retry logic
    if (!error.response && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= MAX_RETRIES) {
        console.log(`[Pet API] Retrying request (${originalRequest._retryCount}/${MAX_RETRIES})...`);
        
        // Exponential backoff delay
        const delay = Math.pow(2, originalRequest._retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return petApi(originalRequest);
      }
    }

    // Handle different error types
    const errorMessage = getErrorMessage(error);
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Extract user-friendly error message from error response
 */
const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  switch (error.response?.status) {
    case 400:
      return 'Invalid request data. Please check your input.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'Pet not found.';
    case 409:
      return 'Conflict: Pet with this information already exists.';
    case 422:
      return 'Validation error. Please check your input data.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      if (!error.response) {
        return 'Network error. Please check your connection and try again.';
      }
      return `Request failed with status ${error.response.status}`;
  }
};

/**
 * Validate pet data before sending to API
 */
const validatePetData = (petData) => {
  const errors = [];

  if (!petData.name || petData.name.trim().length < 1) {
    errors.push('Pet name is required');
  }

  if (!petData.age || petData.age < 0 || petData.age > 50) {
    errors.push('Pet age must be between 0 and 50 years');
  }

  if (!petData.breed || petData.breed.trim().length < 2) {
    errors.push('Pet breed is required (minimum 2 characters)');
  }

  if (!petData.type) {
    errors.push('Pet type is required');
  }

  if (!petData.description || petData.description.trim().length < 20) {
    errors.push('Pet description is required (minimum 20 characters)');
  }

  // Add validation for required backend fields
  if (!petData.intakeSource) {
    errors.push('Intake source is required');
  }

  if (!petData.intakeDate) {
    errors.push('Intake date is required');
  }

  if (petData.image && !isValidUrl(petData.image)) {
    errors.push('Image URL must be a valid URL');
  }

  if (petData.link && !isValidUrl(petData.link)) {
    errors.push('Additional link must be a valid URL');
  }

  return errors;
};

/**
 * Check if string is a valid URL
 */
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Sanitize pet data before sending to API
 */
const sanitizePetData = (petData) => {
  return {
    ...petData,
    name: petData.name?.trim(),
    breed: petData.breed?.trim(),
    type: petData.type?.trim(),
    description: petData.description?.trim(),
    age: petData.age ? Number(petData.age) : undefined,
    image: petData.image?.trim() || undefined,
    link: petData.link?.trim() || undefined,
    // Include new required fields
    intakeSource: petData.intakeSource?.trim(),
    intakeDate: petData.intakeDate
  };
};

// ===== API METHODS =====

/**
 * Get all pets with optional filtering and pagination
 * @param {Object} params - Query parameters for filtering and pagination
 * @returns {Promise<Object>} API response with pets data
 */
export const getAllPets = async (params = {}) => {
  try {
    console.log('[Pet Service] Fetching all pets with params:', params);
    
    const response = await petApi.get('/', { params });
    
    // Validate response structure
    if (!response.data) {
      throw new Error('Invalid response format: missing data');
    }

    // Handle different response formats
    let pets;
    if (Array.isArray(response.data)) {
      pets = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      pets = response.data.data;
    } else if (response.data.pets && Array.isArray(response.data.pets)) {
      pets = response.data.pets;
    } else {
      throw new Error('Invalid response format: pets data not found');
    }

    console.log(`[Pet Service] Successfully fetched ${pets.length} pets`);
    return pets;

  } catch (error) {
    console.error('[Pet Service] Failed to fetch pets:', error.message);
    throw error;
  }
};

/**
 * Get a specific pet by ID
 * @param {string} id - Pet ID
 * @returns {Promise<Object>} Pet data
 */
export const getPetById = async (id) => {
  try {
    if (!id) {
      throw new Error('Pet ID is required');
    }

    console.log(`[Pet Service] Fetching pet with ID: ${id}`);
    
    const response = await petApi.get(`/${id}`);
    
    if (!response.data) {
      throw new Error('Pet not found');
    }

    // Handle different response formats
    const pet = response.data.data || response.data.pet || response.data;
    
    console.log(`[Pet Service] Successfully fetched pet: ${pet.name}`);
    return pet;

  } catch (error) {
    console.error(`[Pet Service] Failed to fetch pet ${id}:`, error.message);
    throw error;
  }
};

/**
 * Add a new pet
 * @param {Object} newPet - Pet data
 * @returns {Promise<Object>} Created pet data
 */
export const addPet = async (newPet) => {
  try {
    if (!newPet) {
      throw new Error('Pet data is required');
    }

    console.log('[Pet Service] Adding new pet:', newPet.name);

    // Validate data
    const validationErrors = validatePetData(newPet);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Sanitize data
    const sanitizedData = sanitizePetData(newPet);

    const response = await petApi.post('/', sanitizedData);
    
    if (!response.data) {
      throw new Error('Failed to create pet: Invalid response');
    }

    // Handle different response formats
    const createdPet = response.data.data || response.data.pet || response.data;
    
    console.log(`[Pet Service] Successfully created pet: ${createdPet.name || 'Unknown'}`);
    return createdPet;

  } catch (error) {
    console.error('[Pet Service] Failed to add pet:', error.message);
    throw error;
  }
};

/**
 * Update an existing pet
 * @param {string} id - Pet ID
 * @param {Object} updatedPet - Updated pet data
 * @returns {Promise<Object>} Updated pet data
 */
export const updatePet = async (id, updatedPet) => {
  try {
    if (!id) {
      throw new Error('Pet ID is required');
    }

    if (!updatedPet) {
      throw new Error('Pet data is required');
    }

    console.log(`[Pet Service] Updating pet ${id}:`, updatedPet.name);

    // Validate data
    const validationErrors = validatePetData(updatedPet);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Sanitize data
    const sanitizedData = sanitizePetData(updatedPet);

    const response = await petApi.put(`/${id}`, sanitizedData);
    
    if (!response.data) {
      throw new Error('Failed to update pet: Invalid response');
    }

    // Handle different response formats
    const updatedPetData = response.data.data || response.data.pet || response.data;
    
    console.log(`[Pet Service] Successfully updated pet: ${updatedPetData.name || 'Unknown'}`);
    return updatedPetData;

  } catch (error) {
    console.error(`[Pet Service] Failed to update pet ${id}:`, error.message);
    throw error;
  }
};

/**
 * Delete a pet
 * @param {string} id - Pet ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deletePet = async (id) => {
  try {
    if (!id) {
      throw new Error('Pet ID is required');
    }

    console.log(`[Pet Service] Deleting pet ${id}`);

    const response = await petApi.delete(`/${id}`);
    
    console.log(`[Pet Service] Successfully deleted pet ${id}`);
    
    // Return success confirmation
    return response.data || { success: true, message: 'Pet deleted successfully' };

  } catch (error) {
    console.error(`[Pet Service] Failed to delete pet ${id}:`, error.message);
    throw error;
  }
};

/**
 * Submit an inquiry for a pet
 * @param {string} petId - Pet ID
 * @param {Object} inquiryData - Inquiry data
 * @returns {Promise<Object>} Inquiry confirmation
 */
export const submitPetInquiry = async (petId, inquiryData) => {
  try {
    if (!petId) {
      throw new Error('Pet ID is required');
    }

    if (!inquiryData || !inquiryData.name || !inquiryData.email || !inquiryData.message) {
      throw new Error('Name, email, and message are required for inquiries');
    }

    console.log(`[Pet Service] Submitting inquiry for pet ${petId}`);

    const response = await petApi.post(`/${petId}/inquiry`, inquiryData);
    
    console.log(`[Pet Service] Successfully submitted inquiry for pet ${petId}`);
    return response.data;

  } catch (error) {
    console.error(`[Pet Service] Failed to submit inquiry for pet ${petId}:`, error.message);
    throw error;
  }
};

/**
 * Get pet statistics
 * @returns {Promise<Object>} Pet statistics
 */
export const getPetStatistics = async () => {
  try {
    console.log('[Pet Service] Fetching pet statistics');
    
    const response = await petApi.get('/statistics');
    
    console.log('[Pet Service] Successfully fetched pet statistics');
    return response.data;

  } catch (error) {
    console.error('[Pet Service] Failed to fetch pet statistics:', error.message);
    throw error;
  }
};

/**
 * Search pets with advanced filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Array>} Filtered pets
 */
export const searchPets = async (searchParams) => {
  try {
    console.log('[Pet Service] Searching pets with filters:', searchParams);
    
    const response = await petApi.get('/search', { params: searchParams });
    
    const pets = response.data.data || response.data.pets || response.data;
    
    console.log(`[Pet Service] Search returned ${pets.length} pets`);
    return pets;

  } catch (error) {
    console.error('[Pet Service] Failed to search pets:', error.message);
    throw error;
  }
};

// Export API instance for advanced usage
export { petApi };

// Export utility functions
export { validatePetData, sanitizePetData, getErrorMessage };

// Default export for backward compatibility
export default {
  getAllPets,
  getPetById,
  addPet,
  updatePet,
  deletePet,
  submitPetInquiry,
  getPetStatistics,
  searchPets
};