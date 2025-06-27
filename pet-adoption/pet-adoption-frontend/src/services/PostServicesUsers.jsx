import axios from 'axios';

/**
 * Enterprise-Grade User API Service
 * Comprehensive API layer with retry logic, error handling, and security
 * Handles all user management operations (NOT authentication)
 */

// ================================================================
// CONFIGURATION
// ================================================================

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  maxRetryDelay: 5000 // 5 seconds max
};

// ================================================================
// AXIOS INSTANCE SETUP
// ================================================================

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// ================================================================
// REQUEST INTERCEPTOR
// ================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF protection if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Add unique request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();

    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      requestId: config.headers['X-Request-ID'],
      timestamp: config.metadata.startTime.toISOString()
    });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ================================================================
// RESPONSE INTERCEPTOR
// ================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
      requestId: response.config.headers['X-Request-ID'],
      duration: `${duration}ms`,
      status: response.status
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const duration = originalRequest?.metadata ? new Date() - originalRequest.metadata.startTime : 0;

    console.error(`❌ API Error: ${error.response?.status || 'Network'} ${originalRequest?.url}`, {
      requestId: originalRequest?.headers?.['X-Request-ID'],
      duration: `${duration}ms`,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    // Handle token expiration and refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          
          const response = await axios.post(`${API_CONFIG.baseURL}/api/refresh-token`, {
            refreshToken
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          console.log('✅ Token refreshed successfully, retrying original request');
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
        
        // Redirect to login if no custom handler
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ================================================================
// ERROR HANDLING
// ================================================================

/**
 * Custom API Error class with enhanced information
 */
class APIError extends Error {
  constructor(message, status, code, details, requestId) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      requestId: this.requestId,
      timestamp: this.timestamp
    };
  }
}

/**
 * Enhanced error processing with detailed logging
 */
const handleAPIError = (error, operation) => {
  const timestamp = new Date().toISOString();
  const requestId = error.config?.headers?.['X-Request-ID'];
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || data?.error || `HTTP ${status} Error`;
    const code = data?.code || `HTTP_${status}`;
    const details = data?.details || null;
    
    console.error(`🔥 API Error [${operation}]:`, {
      timestamp,
      requestId,
      status,
      message,
      details,
      url: error.config?.url,
      method: error.config?.method
    });
    
    throw new APIError(message, status, code, details, requestId);
    
  } else if (error.request) {
    // Network error - no response received
    console.error(`🌐 Network Error [${operation}]:`, {
      timestamp,
      requestId,
      message: 'Network request failed - no response received',
      details: {
        timeout: error.code === 'ECONNABORTED',
        url: error.config?.url,
        method: error.config?.method
      }
    });
    
    const message = error.code === 'ECONNABORTED' 
      ? 'Request timeout. Please check your connection and try again.'
      : 'Network connection failed. Please check your internet connection.';
    
    throw new APIError(message, 0, 'NETWORK_ERROR', { originalError: error.code }, requestId);
    
  } else {
    // Request setup error
    console.error(`⚠️ Request Setup Error [${operation}]:`, {
      timestamp,
      requestId,
      message: error.message,
      stack: error.stack
    });
    
    throw new APIError(
      'An unexpected error occurred while setting up the request', 
      0, 
      'REQUEST_SETUP_ERROR', 
      { originalMessage: error.message },
      requestId
    );
  }
};

/**
 * Retry logic with exponential backoff
 */
const retryRequest = async (requestFn, operation, attempts = API_CONFIG.retryAttempts) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      const isLastAttempt = attempt === attempts;
      const shouldRetry = !error.response || error.response.status >= 500;
      
      if (isLastAttempt || !shouldRetry) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const baseDelay = API_CONFIG.retryDelay;
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitteredDelay = exponentialDelay + Math.random() * 1000; // Add jitter
      const finalDelay = Math.min(jitteredDelay, API_CONFIG.maxRetryDelay);
      
      console.warn(`🔄 Retrying ${operation} (attempt ${attempt}/${attempts}) after ${Math.round(finalDelay)}ms...`, {
        error: error.message,
        status: error.response?.status
      });
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
};

// ================================================================
// VALIDATION HELPERS
// ================================================================

/**
 * Validate user ID parameter
 */
const validateUserId = (id) => {
  if (!id) {
    throw new APIError('User ID is required', 400, 'MISSING_USER_ID');
  }
  
  if (typeof id !== 'string') {
    throw new APIError('User ID must be a string', 400, 'INVALID_USER_ID_TYPE');
  }
  
  if (id.length !== 24) {
    throw new APIError('User ID must be a valid MongoDB ObjectId (24 characters)', 400, 'INVALID_USER_ID_FORMAT');
  }
  
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new APIError('User ID must contain only hexadecimal characters', 400, 'INVALID_USER_ID_CHARS');
  }
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, limit) => {
  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
      throw new APIError('Page must be a number between 1 and 1000', 400, 'INVALID_PAGE');
    }
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new APIError('Limit must be a number between 1 and 100', 400, 'INVALID_LIMIT');
    }
  }
};

// ================================================================
// API SERVICE FUNCTIONS
// ================================================================

/**
 * Get all users with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Items per page (1-100)
 * @param {string} options.search - Search term
 * @param {string} options.role - Role filter
 * @param {string} options.status - Status filter
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @returns {Promise<Object>} Users data with pagination
 */
export const getAllUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  // Validate parameters
  validatePagination(page, limit);

  return retryRequest(async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      if (search.trim()) params.append('search', search.trim());
      if (role) params.append('role', role);
      if (status) params.append('status', status);

      const response = await apiClient.get(`/api/users?${params}`);
      
      // Handle different response formats for flexibility
      if (Array.isArray(response.data)) {
        // Simple array response
        return {
          users: response.data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: response.data.length,
            totalPages: 1
          },
          total: response.data.length
        };
      }
      
      // Structured response
      return {
        users: response.data.users || response.data.data || [],
        pagination: response.data.pagination || {
          page: parseInt(page),
          limit: parseInt(limit),
          total: response.data.total || 0,
          totalPages: Math.ceil((response.data.total || 0) / parseInt(limit))
        },
        total: response.data.total || response.data.users?.length || 0
      };
      
    } catch (error) {
      handleAPIError(error, 'getAllUsers');
    }
  }, 'getAllUsers');
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (id) => {
  validateUserId(id);

  return retryRequest(async () => {
    try {
      const response = await apiClient.get(`/api/users/${id}`);
      return response.data.user || response.data;
    } catch (error) {
      handleAPIError(error, 'getUserById');
    }
  }, 'getUserById');
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user data
 */
export const createUser = async (userData) => {
  if (!userData || typeof userData !== 'object') {
    throw new APIError('User data is required and must be an object', 400, 'INVALID_USER_DATA');
  }

  // Validate required fields
  const requiredFields = ['username', 'email', 'role'];
  const missingFields = requiredFields.filter(field => !userData[field]);
  
  if (missingFields.length > 0) {
    throw new APIError(
      `Missing required fields: ${missingFields.join(', ')}`, 
      400, 
      'MISSING_REQUIRED_FIELDS',
      { missingFields }
    );
  }

  return retryRequest(async () => {
    try {
      // Prepare data with timestamps
      const userPayload = {
        ...userData,
        termsAcceptedAt: userData.termsAcceptedAt || new Date().toISOString(),
        privacyPolicyAcceptedAt: userData.privacyPolicyAcceptedAt || new Date().toISOString()
      };

      const response = await apiClient.post('/api/users', userPayload);
      return response.data;
    } catch (error) {
      handleAPIError(error, 'createUser');
    }
  }, 'createUser');
};

/**
 * Update user by ID
 * @param {string} id - User ID
 * @param {Object} updatedData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
export const updateUser = async (id, updatedData) => {
  validateUserId(id);

  if (!updatedData || typeof updatedData !== 'object') {
    throw new APIError('Update data is required and must be an object', 400, 'INVALID_UPDATE_DATA');
  }

  if (Object.keys(updatedData).length === 0) {
    throw new APIError('Update data cannot be empty', 400, 'EMPTY_UPDATE_DATA');
  }

  return retryRequest(async () => {
    try {
      const response = await apiClient.patch(`/api/users/${id}`, updatedData);
      return response.data;
    } catch (error) {
      handleAPIError(error, 'updateUser');
    }
  }, 'updateUser');
};

/**
 * Delete user by ID
 * @param {string} id - User ID
 * @param {Object} options - Delete options
 * @param {boolean} options.permanent - Whether to permanently delete
 * @param {string} options.reason - Reason for deletion
 * @returns {Promise<Object>} Deletion result
 */
export const deleteUser = async (id, options = {}) => {
  validateUserId(id);

  const { permanent = false, reason = '' } = options;

  return retryRequest(async () => {
    try {
      const response = await apiClient.delete(`/api/users/${id}`, {
        data: { permanent, reason }
      });
      return response.data;
    } catch (error) {
      handleAPIError(error, 'deleteUser');
    }
  }, 'deleteUser');
};

/**
 * Bulk update multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Bulk update result
 */
export const bulkUpdateUsers = async (userIds, updateData) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new APIError('User IDs must be a non-empty array', 400, 'INVALID_USER_IDS');
  }

  if (userIds.length > 100) {
    throw new APIError('Cannot update more than 100 users at once', 400, 'TOO_MANY_USERS');
  }

  // Validate all user IDs
  userIds.forEach((id, index) => {
    try {
      validateUserId(id);
    } catch (error) {
      throw new APIError(
        `Invalid user ID at index ${index}: ${error.message}`, 
        400, 
        'INVALID_USER_ID_IN_ARRAY',
        { index, invalidId: id }
      );
    }
  });

  if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
    throw new APIError('Update data is required and cannot be empty', 400, 'INVALID_UPDATE_DATA');
  }

  return retryRequest(async () => {
    try {
      const response = await apiClient.patch('/api/users/bulk', {
        userIds,
        updateData
      });
      return response.data;
    } catch (error) {
      handleAPIError(error, 'bulkUpdateUsers');
    }
  }, 'bulkUpdateUsers');
};

/**
 * Export users data
 * @param {string} format - Export format (csv, json)
 * @param {Object} filters - Filter options
 * @returns {Promise<Blob>} Export data
 */
export const exportUsers = async (format = 'csv', filters = {}) => {
  if (!['csv', 'json'].includes(format)) {
    throw new APIError('Export format must be either "csv" or "json"', 400, 'INVALID_EXPORT_FORMAT');
  }

  return retryRequest(async () => {
    try {
      const params = new URLSearchParams({ format, ...filters });
      
      const response = await apiClient.get(`/api/users/export?${params}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      handleAPIError(error, 'exportUsers');
    }
  }, 'exportUsers');
};

/**
 * Get user statistics
 * @param {number} days - Number of days for statistics
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async (days = 30) => {
  if (typeof days !== 'number' || days < 1 || days > 365) {
    throw new APIError('Days must be a number between 1 and 365', 400, 'INVALID_DAYS_PARAMETER');
  }

  return retryRequest(async () => {
    try {
      const response = await apiClient.get(`/api/users/stats?days=${days}`);
      return response.data;
    } catch (error) {
      handleAPIError(error, 'getUserStats');
    }
  }, 'getUserStats');
};

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Check if the API service is healthy
 * @returns {Promise<boolean>} Health status
 */
export const checkAPIHealth = async () => {
  try {
    const response = await apiClient.get('/api/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

/**
 * Get current API configuration
 * @returns {Object} API configuration
 */
export const getAPIConfig = () => ({
  ...API_CONFIG,
  // Don't expose sensitive information
  hasToken: !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'))
});

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  console.log('🧹 Authentication tokens cleared');
};

// ================================================================
// ERROR EXPORT
// ================================================================

export { APIError };

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  exportUsers,
  getUserStats,
  checkAPIHealth,
  getAPIConfig,
  clearAuthTokens,
  APIError
};