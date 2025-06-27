import axios from 'axios';

/**
 * Enterprise-Grade Adoption Request API Service
 * Comprehensive API layer with retry logic, error handling, and security
 * Handles all adoption request management operations
 */

// ================================================================
// CONFIGURATION
// ================================================================

const API_CONFIG = {
  baseURL: `${import.meta.env.VITE_API_URL}` || 'http://localhost:5000',
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

    console.log(`🚀 Adoption API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      requestId: config.headers['X-Request-ID'],
      timestamp: config.metadata.startTime.toISOString()
    });

    return config;
  },
  (error) => {
    console.error('❌ Adoption request interceptor error:', error);
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
    
    console.log(`✅ Adoption API Response: ${response.status} ${response.config.url}`, {
      requestId: response.config.headers['X-Request-ID'],
      duration: `${duration}ms`,
      status: response.status
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const duration = originalRequest?.metadata ? new Date() - originalRequest.metadata.startTime : 0;

    console.error(`❌ Adoption API Error: ${error.response?.status || 'Network'} ${originalRequest?.url}`, {
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
          console.log('🔄 Attempting token refresh for adoption service...');
          
          const response = await axios.post(`${API_CONFIG.baseURL}/api/refresh-token`, {
            refreshToken
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Update the failed request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          console.log('✅ Token refreshed successfully, retrying adoption request');
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed for adoption service:', refreshError);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
        
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
 * Custom Adoption API Error class with enhanced information
 */
class AdoptionAPIError extends Error {
  constructor(message, status, code, details, requestId) {
    super(message);
    this.name = 'AdoptionAPIError';
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
const handleAdoptionAPIError = (error, operation) => {
  const timestamp = new Date().toISOString();
  const requestId = error.config?.headers?.['X-Request-ID'];
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || data?.error || `HTTP ${status} Error`;
    const code = data?.code || `HTTP_${status}`;
    const details = data?.details || null;
    
    console.error(`🔥 Adoption API Error [${operation}]:`, {
      timestamp,
      requestId,
      status,
      message,
      details,
      url: error.config?.url,
      method: error.config?.method
    });
    
    throw new AdoptionAPIError(message, status, code, details, requestId);
    
  } else if (error.request) {
    // Network error - no response received
    console.error(`🌐 Adoption Network Error [${operation}]:`, {
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
    
    throw new AdoptionAPIError(message, 0, 'NETWORK_ERROR', { originalError: error.code }, requestId);
    
  } else {
    // Request setup error
    console.error(`⚠️ Adoption Request Setup Error [${operation}]:`, {
      timestamp,
      requestId,
      message: error.message,
      stack: error.stack
    });
    
    throw new AdoptionAPIError(
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
const retryAdoptionRequest = async (requestFn, operation, attempts = API_CONFIG.retryAttempts) => {
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
      
      console.warn(`🔄 Retrying adoption ${operation} (attempt ${attempt}/${attempts}) after ${Math.round(finalDelay)}ms...`, {
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
 * Validate adoption request ID parameter
 */
const validateAdoptionRequestId = (id) => {
  if (!id) {
    throw new AdoptionAPIError('Adoption request ID is required', 400, 'MISSING_REQUEST_ID');
  }
  
  if (typeof id !== 'string') {
    throw new AdoptionAPIError('Adoption request ID must be a string', 400, 'INVALID_REQUEST_ID_TYPE');
  }
  
  if (id.length !== 24) {
    throw new AdoptionAPIError('Adoption request ID must be a valid MongoDB ObjectId (24 characters)', 400, 'INVALID_REQUEST_ID_FORMAT');
  }
  
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AdoptionAPIError('Adoption request ID must contain only hexadecimal characters', 400, 'INVALID_REQUEST_ID_CHARS');
  }
};

/**
 * Validate pagination parameters
 */
const validateAdoptionPagination = (page, limit) => {
  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 1000) {
      throw new AdoptionAPIError('Page must be a number between 1 and 1000', 400, 'INVALID_PAGE');
    }
  }
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AdoptionAPIError('Limit must be a number between 1 and 100', 400, 'INVALID_LIMIT');
    }
  }
};

/**
 * Validate adoption request data
 */
const validateAdoptionRequestData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new AdoptionAPIError('Adoption request data is required and must be an object', 400, 'INVALID_REQUEST_DATA');
  }

  // Validate required fields
  const requiredFields = ['petId', 'applicantName', 'applicantEmail', 'applicantPhone', 'address', 'housingType', 'reason'];
  const missingFields = requiredFields.filter(field => !data[field] || (typeof data[field] === 'string' && data[field].trim() === ''));
  
  if (missingFields.length > 0) {
    throw new AdoptionAPIError(
      `Missing required fields: ${missingFields.join(', ')}`, 
      400, 
      'MISSING_REQUIRED_FIELDS',
      { missingFields }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.applicantEmail)) {
    throw new AdoptionAPIError('Please provide a valid email address', 400, 'INVALID_EMAIL_FORMAT');
  }

  // Validate phone format
  const phoneRegex = /^[\+]?[1-9][\d]{9,14}$/;
  const cleanPhone = data.applicantPhone.replace(/[\s\-\(\)\.]/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    throw new AdoptionAPIError('Please provide a valid phone number', 400, 'INVALID_PHONE_FORMAT');
  }

  // Validate housing type
  const validHousingTypes = ['house', 'apartment', 'condo', 'townhouse', 'mobile_home', 'other'];
  if (!validHousingTypes.includes(data.housingType.toLowerCase())) {
    throw new AdoptionAPIError(
      `Housing type must be one of: ${validHousingTypes.join(', ')}`, 
      400, 
      'INVALID_HOUSING_TYPE'
    );
  }

  // Validate reason length
  if (data.reason.trim().length < 20) {
    throw new AdoptionAPIError('Reason for adoption must be at least 20 characters', 400, 'REASON_TOO_SHORT');
  }

  if (data.reason.trim().length > 2000) {
    throw new AdoptionAPIError('Reason for adoption must be less than 2000 characters', 400, 'REASON_TOO_LONG');
  }
};

/**
 * Validate status update data
 */
const validateStatusUpdate = (data) => {
  if (!data || typeof data !== 'object') {
    throw new AdoptionAPIError('Status update data is required and must be an object', 400, 'INVALID_UPDATE_DATA');
  }

  if (!data.status) {
    throw new AdoptionAPIError('Status is required for update', 400, 'MISSING_STATUS');
  }

  const validStatuses = ['pending', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'completed', 'withdrawn'];
  if (!validStatuses.includes(data.status.toLowerCase())) {
    throw new AdoptionAPIError(
      `Status must be one of: ${validStatuses.join(', ')}`, 
      400, 
      'INVALID_STATUS'
    );
  }

  // Validate rejection reason if status is rejected
  if (data.status.toLowerCase() === 'rejected' && (!data.rejectionReason || data.rejectionReason.trim().length < 10)) {
    throw new AdoptionAPIError('Rejection reason is required and must be at least 10 characters when rejecting an application', 400, 'MISSING_REJECTION_REASON');
  }
};

// ================================================================
// API SERVICE FUNCTIONS
// ================================================================

/**
 * Get all adoption requests with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Items per page (1-100)
 * @param {string} options.status - Status filter
 * @param {string} options.petId - Pet ID filter
 * @param {string} options.search - Search term
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.priority - Priority filter
 * @param {boolean} options.followUpRequired - Follow-up required filter
 * @returns {Promise<Object>} Adoption requests data with pagination
 */
export const getAllAdoptionRequests = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    status = '',
    petId = '',
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    priority = '',
    followUpRequired = ''
  } = options;

  // Validate parameters
  validateAdoptionPagination(page, limit);

  return retryAdoptionRequest(async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      if (status) params.append('status', status);
      if (petId) params.append('petId', petId);
      if (search.trim()) params.append('search', search.trim());
      if (priority) params.append('priority', priority);
      if (followUpRequired !== '') params.append('followUpRequired', followUpRequired);

      const response = await apiClient.get(`/admin/adoption-requests?${params}`);
      
      // Handle different response formats for flexibility
      return {
        data: response.data.data || response.data.requests || [],
        pagination: response.data.pagination || {
          currentPage: parseInt(page),
          totalPages: 1,
          totalCount: response.data.data?.length || 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: parseInt(limit)
        },
        filters: response.data.filters || {},
        success: response.data.success || true
      };
      
    } catch (error) {
      handleAdoptionAPIError(error, 'getAllAdoptionRequests');
    }
  }, 'getAllAdoptionRequests');
};

/**
 * Get adoption request by ID
 * @param {string} id - Adoption request ID
 * @returns {Promise<Object>} Adoption request data
 */
export const getAdoptionRequestById = async (id) => {
  validateAdoptionRequestId(id);

  return retryAdoptionRequest(async () => {
    try {
      const response = await apiClient.get(`/admin/adoption-requests/${id}`);
      return response.data;
    } catch (error) {
      handleAdoptionAPIError(error, 'getAdoptionRequestById');
    }
  }, 'getAdoptionRequestById');
};

/**
 * Create new adoption request
 * @param {Object} requestData - Adoption request data
 * @returns {Promise<Object>} Created adoption request data
 */
export const createAdoptionRequest = async (requestData) => {
  validateAdoptionRequestData(requestData);

  return retryAdoptionRequest(async () => {
    try {
      // Prepare data with proper formatting
      const adoptionPayload = {
        ...requestData,
        applicantEmail: requestData.applicantEmail.trim().toLowerCase(),
        applicantPhone: requestData.applicantPhone.replace(/[\s\-\(\)\.]/g, ''),
        housingType: requestData.housingType.toLowerCase(),
        reason: requestData.reason.trim(),
        submittedAt: new Date().toISOString()
      };

      const response = await apiClient.post('/admin/adoption-requests', adoptionPayload);
      return response.data;
    } catch (error) {
      handleAdoptionAPIError(error, 'createAdoptionRequest');
    }
  }, 'createAdoptionRequest');
};

/**
 * Update adoption request status
 * @param {string} id - Adoption request ID
 * @param {Object} updateData - Status update data
 * @returns {Promise<Object>} Updated adoption request data
 */
export const updateAdoptionRequestStatus = async (id, updateData) => {
  validateAdoptionRequestId(id);
  validateStatusUpdate(updateData);

  return retryAdoptionRequest(async () => {
    try {
      const response = await apiClient.patch(`/admin/adoption-requests/${id}`, updateData);
      return response.data;
    } catch (error) {
      handleAdoptionAPIError(error, 'updateAdoptionRequestStatus');
    }
  }, 'updateAdoptionRequestStatus');
};

/**
 * Add communication log entry to adoption request
 * @param {string} id - Adoption request ID
 * @param {Object} communicationData - Communication data
 * @returns {Promise<Object>} Communication log result
 */
export const addCommunicationLog = async (id, communicationData) => {
  validateAdoptionRequestId(id);

  if (!communicationData || typeof communicationData !== 'object') {
    throw new AdoptionAPIError('Communication data is required and must be an object', 400, 'INVALID_COMMUNICATION_DATA');
  }

  const { type, message } = communicationData;

  if (!type || !message) {
    throw new AdoptionAPIError('Communication type and message are required', 400, 'MISSING_COMMUNICATION_FIELDS');
  }

  const validTypes = ['email_sent', 'phone_call', 'meeting_scheduled', 'meeting_completed', 'note_added'];
  if (!validTypes.includes(type)) {
    throw new AdoptionAPIError(
      `Communication type must be one of: ${validTypes.join(', ')}`, 
      400, 
      'INVALID_COMMUNICATION_TYPE'
    );
  }

  return retryAdoptionRequest(async () => {
    try {
      const response = await apiClient.post(`/admin/adoption-requests/${id}/communication`, {
        type,
        message: message.trim()
      });
      return response.data;
    } catch (error) {
      handleAdoptionAPIError(error, 'addCommunicationLog');
    }
  }, 'addCommunicationLog');
};

/**
 * Get adoption request statistics
 * @param {number} period - Period in days for statistics
 * @returns {Promise<Object>} Adoption request statistics
 */
export const getAdoptionRequestStats = async (period = 30) => {
  if (typeof period !== 'number' || period < 1 || period > 365) {
    throw new AdoptionAPIError('Period must be a number between 1 and 365', 400, 'INVALID_PERIOD');
  }

  return retryAdoptionRequest(async () => {
    try {
      const response = await apiClient.get(`/admin/adoption-requests/stats?period=${period}`);
      return response.data;
    } catch (error) {
      handleAdoptionAPIError(error, 'getAdoptionRequestStats');
    }
  }, 'getAdoptionRequestStats');
};

/**
 * Get adoption requests requiring follow-up
 * @returns {Promise<Object>} Follow-up requests data
 */
export const getFollowUpRequests = async () => {
  return retryAdoptionRequest(async () => {
    try {
      const response = await apiClient.get('/admin/adoption-requests/follow-up');
      return response.data;
    } catch (error) {
      handleAdoptionAPIError(error, 'getFollowUpRequests');
    }
  }, 'getFollowUpRequests');
};

/**
 * Delete adoption request (withdraw application)
 * @param {string} id - Adoption request ID
 * @param {Object} options - Delete options
 * @param {string} options.reason - Reason for withdrawal
 * @returns {Promise<Object>} Deletion result
 */
export const withdrawAdoptionRequest = async (id, options = {}) => {
  validateAdoptionRequestId(id);

  const { reason = 'Application withdrawn by user' } = options;

  return retryAdoptionRequest(async () => {
    try {
      const response = await apiClient.patch(`/admin/adoption-requests/${id}`, {
        status: 'withdrawn',
        adminNotes: reason
      });
      return response.data;
    } catch (error) {
      handleAdoptionAPIError(error, 'withdrawAdoptionRequest');
    }
  }, 'withdrawAdoptionRequest');
};

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Check if the adoption API service is healthy
 * @returns {Promise<boolean>} Health status
 */
export const checkAdoptionAPIHealth = async () => {
  try {
    const response = await apiClient.get('/api/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('Adoption API health check failed:', error);
    return false;
  }
};

/**
 * Get current adoption API configuration
 * @returns {Object} API configuration
 */
export const getAdoptionAPIConfig = () => ({
  ...API_CONFIG,
  // Don't expose sensitive information
  hasToken: !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'))
});

/**
 * Format adoption request data for display
 * @param {Object} request - Adoption request object
 * @returns {Object} Formatted request data
 */
export const formatAdoptionRequest = (request) => {
  if (!request) return null;

  return {
    ...request,
    formattedPhone: request.applicantPhone?.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'),
    applicationAge: request.createdAt ? Math.ceil((new Date() - new Date(request.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
    statusBadge: {
      pending: { color: 'blue', text: 'Pending Review' },
      under_review: { color: 'yellow', text: 'Under Review' },
      interview_scheduled: { color: 'purple', text: 'Interview Scheduled' },
      approved: { color: 'green', text: 'Approved' },
      rejected: { color: 'red', text: 'Rejected' },
      completed: { color: 'emerald', text: 'Completed' },
      withdrawn: { color: 'gray', text: 'Withdrawn' }
    }[request.status] || { color: 'gray', text: 'Unknown' }
  };
};

// ================================================================
// ERROR EXPORT
// ================================================================

export { AdoptionAPIError };

// ================================================================
// BACKWARD COMPATIBILITY ALIASES
// ================================================================

// Legacy function names for backward compatibility
export const getAllAdoptions = getAllAdoptionRequests;
export const getAdoptionById = getAdoptionRequestById;
export const createAdoption = createAdoptionRequest;
export const updateAdoption = updateAdoptionRequestStatus;
export const deleteAdoption = withdrawAdoptionRequest;

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default {
  getAllAdoptionRequests,
  getAdoptionRequestById,
  createAdoptionRequest,
  updateAdoptionRequestStatus,
  addCommunicationLog,
  getAdoptionRequestStats,
  getFollowUpRequests,
  withdrawAdoptionRequest,
  checkAdoptionAPIHealth,
  getAdoptionAPIConfig,
  formatAdoptionRequest,
  AdoptionAPIError,
  // Legacy aliases
  getAllAdoptions,
  getAdoptionById,
  createAdoption,
  updateAdoption,
  deleteAdoption
};