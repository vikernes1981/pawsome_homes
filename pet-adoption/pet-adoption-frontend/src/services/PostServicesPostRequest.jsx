import axios from 'axios';

/**
 * Adoption Request Service
 * Handles API calls for adoption request operations with comprehensive error handling
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL_ADOPTION = `${API_BASE_URL}/admin/adoption-requests`;

// Request timeout configuration
const REQUEST_TIMEOUT = 30000; // 30 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Custom error class for adoption request errors
 */
class AdoptionRequestError extends Error {
  constructor(message, statusCode, originalError) {
    super(message);
    this.name = 'AdoptionRequestError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Get authentication token from localStorage with validation
 * @returns {string|null} Authentication token or null if not found/invalid
 */
const getAuthToken = () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.warn('No authentication token found');
      return null;
    }

    // Basic token validation (check if it's not empty and has reasonable length)
    if (typeof token !== 'string' || token.trim().length < 10) {
      console.warn('Invalid authentication token format');
      localStorage.removeItem('authToken'); // Clean up invalid token
      return null;
    }

    return token.trim();
  } catch (error) {
    console.error('Error accessing localStorage for auth token:', error);
    return null;
  }
};

/**
 * Create axios instance with default configuration
 */
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request for debugging (only in development)
      if (import.meta.env.DEV) {
        console.debug('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasAuth: !!token,
          dataSize: config.data ? JSON.stringify(config.data).length : 0
        });
      }

      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for global error handling
  instance.interceptors.response.use(
    (response) => {
      // Log successful responses in development
      if (import.meta.env.DEV) {
        console.debug('API Response:', {
          status: response.status,
          url: response.config.url,
          dataSize: response.data ? JSON.stringify(response.data).length : 0
        });
      }
      return response;
    },
    (error) => {
      // Enhanced error logging
      const errorInfo = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      };

      console.error('API Error:', errorInfo);

      // Handle specific error cases
      if (error.response?.status === 401) {
        console.warn('Authentication failed - clearing token');
        localStorage.removeItem('authToken');
        // Could trigger a redirect to login page here
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Retry function for failed requests
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Promise that resolves with the function result
 */
const retryRequest = async (fn, retries = RETRY_ATTEMPTS, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      console.warn(`Request failed, retrying in ${delay}ms. Attempts remaining: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 1.5); // Exponential backoff
    }
    throw error;
  }
};

/**
 * Determine if an error should trigger a retry
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the request should be retried
 */
const shouldRetry = (error) => {
  // Don't retry on authentication errors or client errors (4xx)
  const status = error.response?.status;
  if (status && status >= 400 && status < 500) {
    return false;
  }

  // Retry on network errors, timeouts, and server errors (5xx)
  return (
    error.code === 'ECONNABORTED' || // Timeout
    error.code === 'ENOTFOUND' ||   // Network error
    error.code === 'ECONNREFUSED' || // Connection refused
    !error.response ||               // Network error
    (status && status >= 500)        // Server error
  );
};

/**
 * Validate adoption request data before sending
 * @param {Object} data - Adoption request data
 * @throws {AdoptionRequestError} If validation fails
 */
const validateAdoptionRequestData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new AdoptionRequestError('Invalid request data: must be an object', 400);
  }

  const requiredFields = [
    'petId',
    'applicantName',
    'applicantEmail',
    'applicantPhone',
    'address',
    'housingType',
    'reason'
  ];

  const missingFields = requiredFields.filter(field => {
    if (field === 'address') {
      return !data.address || 
             !data.address.street || 
             !data.address.city || 
             !data.address.region || 
             !data.address.zip;
    }
    return !data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0);
  });

  if (missingFields.length > 0) {
    throw new AdoptionRequestError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400
    );
  }

  // Additional validation
  if (data.applicantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.applicantEmail)) {
    throw new AdoptionRequestError('Invalid email format', 400);
  }

  if (data.reason && data.reason.length < 20) {
    throw new AdoptionRequestError('Reason must be at least 20 characters long', 400);
  }

  if (data.applicantName && data.applicantName.length > 100) {
    throw new AdoptionRequestError('Name must be less than 100 characters', 400);
  }
};

/**
 * Process and format error for user display
 * @param {Error} error - The error to process
 * @returns {Object} Formatted error object
 */
const processError = (error) => {
  const defaultMessage = 'An unexpected error occurred. Please try again.';
  
  // Handle network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        type: 'network',
        statusCode: 408
      };
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        message: 'Unable to connect to the server. Please try again later.',
        type: 'network',
        statusCode: 503
      };
    }
    return {
      message: 'Network error. Please check your connection.',
      type: 'network',
      statusCode: 0
    };
  }

  const status = error.response.status;
  const serverMessage = error.response.data?.message || error.response.data?.error;

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      return {
        message: serverMessage || 'Invalid request data. Please check your information.',
        type: 'validation',
        statusCode: status,
        details: error.response.data?.details
      };
    case 401:
      return {
        message: 'Authentication required. Please log in and try again.',
        type: 'auth',
        statusCode: status
      };
    case 403:
      return {
        message: 'You do not have permission to perform this action.',
        type: 'permission',
        statusCode: status
      };
    case 404:
      return {
        message: 'The requested pet or resource was not found.',
        type: 'notFound',
        statusCode: status
      };
    case 409:
      return {
        message: serverMessage || 'You have already submitted an application for this pet.',
        type: 'conflict',
        statusCode: status
      };
    case 429:
      return {
        message: serverMessage || 'Too many requests. Please wait before trying again.',
        type: 'rateLimit',
        statusCode: status,
        retryAfter: error.response.data?.retryAfter
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: 'Server error. Please try again later.',
        type: 'server',
        statusCode: status
      };
    default:
      return {
        message: serverMessage || defaultMessage,
        type: 'unknown',
        statusCode: status
      };
  }
};

/**
 * Create a new adoption request
 * @param {Object} data - Adoption request data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Created adoption request
 * @throws {AdoptionRequestError} If the request fails
 */
export const createRequest = async (data, options = {}) => {
  try {
    // Validate input data
    validateAdoptionRequestData(data);

    const axiosInstance = createAxiosInstance();
    
    // Sanitize data
    const sanitizedData = {
      ...data,
      applicantName: data.applicantName?.trim(),
      applicantEmail: data.applicantEmail?.trim().toLowerCase(),
      applicantPhone: data.applicantPhone?.replace(/[\s\-\(\)\.]/g, ''),
      reason: data.reason?.trim(),
      experience: data.experience?.trim(),
      address: {
        street: data.address.street?.trim(),
        city: data.address.city?.trim(),
        region: data.address.region?.trim(),
        zip: data.address.zip?.trim(),
        country: data.address.country?.trim() || 'United States'
      }
    };

    // Make request with retry logic
    const makeRequest = async () => {
      const response = await axiosInstance.post('/admin/adoption-requests', sanitizedData);
      return response.data;
    };

    const result = await retryRequest(makeRequest);

    // Log success in development
    if (import.meta.env.DEV) {
      console.info('Adoption request created successfully:', {
        petId: data.petId,
        applicantEmail: data.applicantEmail,
        requestId: result.id || result._id
      });
    }

    // Dispatch success event for UI updates
    window.dispatchEvent(new CustomEvent('adoption-request-created', {
      detail: { requestId: result.id || result._id, petId: data.petId }
    }));

    return result;

  } catch (error) {
    const processedError = processError(error);
    
    // Log detailed error information
    console.error('Failed to create adoption request:', {
      error: processedError,
      petId: data?.petId,
      applicantEmail: data?.applicantEmail,
      originalError: error.message
    });

    // Dispatch error event for global error handling
    window.dispatchEvent(new CustomEvent('adoption-request-error', {
      detail: processedError
    }));

    // Throw custom error with processed information
    throw new AdoptionRequestError(
      processedError.message,
      processedError.statusCode,
      error
    );
  }
};

/**
 * Get adoption request status
 * @param {string} requestId - Adoption request ID
 * @returns {Promise<Object>} Adoption request status
 */
export const getRequestStatus = async (requestId) => {
  try {
    if (!requestId) {
      throw new AdoptionRequestError('Request ID is required', 400);
    }

    const axiosInstance = createAxiosInstance();
    
    const makeRequest = async () => {
      const response = await axiosInstance.get(`/api/adoption-requests/${requestId}`);
      return response.data;
    };

    return await retryRequest(makeRequest);

  } catch (error) {
    const processedError = processError(error);
    console.error('Failed to get request status:', processedError);
    throw new AdoptionRequestError(
      processedError.message,
      processedError.statusCode,
      error
    );
  }
};

/**
 * Check if user can apply for a specific pet
 * @param {string} petId - Pet ID to check
 * @returns {Promise<boolean>} Whether user can apply
 */
export const canApplyForPet = async (petId) => {
  try {
    if (!petId) {
      return false;
    }

    const axiosInstance = createAxiosInstance();
    
    const makeRequest = async () => {
      const response = await axiosInstance.get(`/api/pets/${petId}/can-apply`);
      return response.data.canApply;
    };

    return await retryRequest(makeRequest);

  } catch (error) {
    console.warn('Failed to check application eligibility:', error.message);
    return false; // Default to false on error
  }
};

// Export the custom error class for use in components
export { AdoptionRequestError };
