import express from 'express';
import { 
  getAllAdoptionRequests, 
  getAdoptionRequestById,
  updateAdoptionRequestStatus, 
  createAdoptionRequest,
  addCommunicationLog,
  getAdoptionRequestStats,
  getFollowUpRequests
} from '../controllers/adoptionController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import logger from '../services/logger.js';

// DECLARE ROUTER IMMEDIATELY AFTER IMPORTS - BEFORE ANY MIDDLEWARE
const router = express.Router();

/**
 * Authorization middleware for adoption request access
 */
const adoptionAuthorizationMiddleware = (req, res, next) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;
  
  // Log authorization attempt
  logger.debug('Adoption authorization check', {
    method: req.method,
    path: req.path,
    userRole,
    userId,
    requestId: req.params.id
  });

  // For GET requests (viewing requests)
  if (req.method === 'GET') {
    // Only admins and staff can view all adoption requests
    if (!['admin', 'super_admin', 'staff'].includes(userRole)) {
      logger.warn('Unauthorized attempt to view adoption requests', {
        userId,
        userRole,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators and staff can view adoption requests'
      });
    }
  }

  // For PATCH requests (status updates)
  if (req.method === 'PATCH') {
    // Only admins and staff can update adoption request status
    if (!['admin', 'super_admin', 'staff'].includes(userRole)) {
      logger.warn('Unauthorized attempt to update adoption request', {
        userId,
        userRole,
        requestId: req.params.id,
        ip: req.ip
      });
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators and staff can update adoption request status'
      });
    }
  }

  next();
};

/**
 * Middleware to wrap async route handlers with error handling
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate limiting for adoption requests
 * Prevents spam applications while allowing legitimate users
 */
const adoptionRateLimitMap = new Map();
const ADOPTION_RATE_LIMITS = {
  create: { window: 60 * 60 * 1000, maxAttempts: 3 }, // 3 applications per hour
  update: { window: 5 * 60 * 1000, maxAttempts: 10 }, // 10 updates per 5 minutes (admin)
  view: { window: 60 * 1000, maxAttempts: 30 } // 30 views per minute
};

/**
 * Rate limiting middleware for adoption routes
 * @param {string} operation - Type of operation (create, update, view)
 */
const adoptionRateLimitMiddleware = (operation = 'view') => {
  return (req, res, next) => {
    const clientIp = req.ip;
    const now = Date.now();
    const limits = ADOPTION_RATE_LIMITS[operation];
    
    // Clean up old entries
    for (const [key, data] of adoptionRateLimitMap.entries()) {
      if (now - data.firstAttempt > limits.window) {
        adoptionRateLimitMap.delete(key);
      }
    }
    
    const rateLimitKey = `${clientIp}:${operation}`;
    const attemptData = adoptionRateLimitMap.get(rateLimitKey);
    
    if (!attemptData) {
      adoptionRateLimitMap.set(rateLimitKey, {
        firstAttempt: now,
        attempts: 1
      });
      next();
    } else if (now - attemptData.firstAttempt > limits.window) {
      adoptionRateLimitMap.set(rateLimitKey, {
        firstAttempt: now,
        attempts: 1
      });
      next();
    } else if (attemptData.attempts >= limits.maxAttempts) {
      logger.warn(`Adoption ${operation} rate limit exceeded`, {
        ip: clientIp,
        operation,
        attempts: attemptData.attempts,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many ${operation} requests. Please try again later.`,
        retryAfter: Math.ceil((limits.window - (now - attemptData.firstAttempt)) / 1000)
      });
    } else {
      attemptData.attempts++;
      next();
    }
  };
};

/**
 * Validation middleware for adoption requests
 */
const adoptionValidationMiddleware = () => {
  return (req, res, next) => {
    logger.info('Adoption route accessed', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userRole: req.user?.role,
      hasBody: !!req.body && Object.keys(req.body).length > 0
    });

    // Validate Content-Type for POST/PATCH requests
    if (['POST', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        logger.warn('Invalid Content-Type for adoption request', {
          method: req.method,
          contentType,
          ip: req.ip,
          path: req.path,
          userId: req.user?.id
        });
        return res.status(400).json({
          error: 'Invalid Content-Type',
          message: 'Content-Type must be application/json'
        });
      }

      // Check for empty request body
      if (!req.body || Object.keys(req.body).length === 0) {
        logger.warn('Empty adoption request body', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userId: req.user?.id
        });
        return res.status(400).json({
          error: 'Empty request body',
          message: 'Request data is required'
        });
      }
    }

    // Validate ObjectId format for routes with :id parameter
    if (req.params.id) {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(req.params.id)) {
        logger.warn('Invalid ObjectId in adoption route', {
          providedId: req.params.id,
          ip: req.ip,
          path: req.path,
          userId: req.user?.id
        });
        return res.status(400).json({
          error: 'Invalid ID format',
          message: 'The provided adoption request ID is not valid'
        });
      }
    }

    // Validate required fields for POST requests (adoption applications)
    if (req.method === 'POST' && req.path.includes('adoption-requests')) {
      const errors = [];
      const {
        petId,
        applicantName,
        applicantEmail,
        applicantPhone,
        address,
        housingType,
        hasYard,
        hasPets,
        experience,
        reason
      } = req.body;

      // Required field validation
      if (!petId || typeof petId !== 'string' || petId.trim().length === 0) {
        errors.push('Pet ID is required');
      } else if (!/^[0-9a-fA-F]{24}$/.test(petId)) {
        errors.push('Valid Pet ID is required');
      }

      if (!applicantName || typeof applicantName !== 'string' || applicantName.trim().length === 0) {
        errors.push('Applicant name is required');
      } else if (applicantName.trim().length > 100) {
        errors.push('Applicant name must be less than 100 characters');
      }

      if (!applicantEmail || typeof applicantEmail !== 'string') {
        errors.push('Applicant email is required');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(applicantEmail.trim())) {
          errors.push('Valid email address is required');
        }
      }

      if (!applicantPhone || typeof applicantPhone !== 'string') {
        errors.push('Phone number is required');
      } else {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = applicantPhone.replace(/[\s\-\(\)\.]/g, '');
        if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
          errors.push('Valid phone number is required (minimum 10 digits)');
        }
      }

      if (!address || typeof address !== 'object') {
        errors.push('Address object is required');
      } else {
        if (!address.street || address.street.trim().length < 5) {
          errors.push('Street address is required (minimum 5 characters)');
        }
        if (!address.city || address.city.trim().length < 2) {
          errors.push('City is required (minimum 2 characters)');
        }
        if (!address.region || address.region.trim().length < 2) {
          errors.push('State/Province/Region is required (minimum 2 characters)');
        }
        if (!address.zip || address.zip.trim().length < 3) {
          errors.push('ZIP/Postal code is required (minimum 3 characters)');
        }
      }

      if (!housingType || typeof housingType !== 'string') {
        errors.push('Housing type is required');
      } else if (!['house', 'apartment', 'condo', 'townhouse', 'other'].includes(housingType.toLowerCase())) {
        errors.push('Housing type must be one of: house, apartment, condo, townhouse, other');
      }

      if (hasYard !== undefined && typeof hasYard !== 'boolean') {
        errors.push('Has yard must be true or false');
      }

      if (hasPets !== undefined && typeof hasPets !== 'boolean') {
        errors.push('Has pets must be true or false');
      }

      if (!reason || typeof reason !== 'string' || reason.trim().length < 20) {
        errors.push('Reason for adoption is required (minimum 20 characters)');
      } else if (reason.trim().length > 1000) {
        errors.push('Reason must be less than 1000 characters');
      }

      // Experience validation (optional but if provided, validate)
      if (experience && (typeof experience !== 'string' || experience.length > 1000)) {
        errors.push('Experience description must be less than 1000 characters');
      }

      if (errors.length > 0) {
        logger.warn('Adoption request validation failed', {
          errors,
          ip: req.ip,
          userId: req.user?.id,
          petId,
          providedFields: Object.keys(req.body)
        });
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Please correct the following errors',
          details: errors
        });
      }

      // Sanitize inputs
      req.body.applicantName = applicantName.trim();
      req.body.applicantEmail = applicantEmail.trim().toLowerCase();
      req.body.applicantPhone = applicantPhone.replace(/[\s\-\(\)\.]/g, '');
      req.body.housingType = housingType.toLowerCase();
      req.body.reason = reason.trim();
      if (experience) req.body.experience = experience.trim();
    }

    // Validate status updates (PATCH requests)
    if (req.method === 'PATCH' && req.body.status) {
      const validStatuses = ['pending', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'completed', 'withdrawn'];
      if (!validStatuses.includes(req.body.status.toLowerCase())) {
        logger.warn('Invalid status update attempted', {
          providedStatus: req.body.status,
          ip: req.ip,
          userId: req.user?.id,
          requestId: req.params.id
        });
        return res.status(400).json({
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    next();
  };
};

/**
 * Route-specific error handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const routeErrorHandler = (error, req, res, next) => {
  logger.errorLog(error, {
    route: 'adoption',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    requestId: req.params?.id,
    petId: req.body?.petId
  });

  // Handle specific adoption-related errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.errors || {}
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid Data Format',
      message: 'Invalid ID format or data type provided'
    });
  }

  if (error.code === 11000) { // MongoDB duplicate key error
    return res.status(409).json({
      error: 'Duplicate Application',
      message: 'You have already submitted an application for this pet'
    });
  }

  if (error.message?.includes('Pet not found')) {
    return res.status(404).json({
      error: 'Pet not found',
      message: 'The requested pet is no longer available for adoption'
    });
  }

  if (error.message?.includes('already adopted')) {
    return res.status(409).json({
      error: 'Pet unavailable',
      message: 'This pet has already been adopted'
    });
  }

  // Pass to global error handler
  next(error);
};





/**
 * @route   GET /admin/adoption-requests/stats
 * @desc    Get adoption request statistics
 * @access  Admin/Staff
 * @query   {number} [period] - Period in days (default: 30)
 */
router.get('/adoption-requests/stats',
  authenticate,
  requireRole(['admin', 'super_admin', 'staff']),
  adoptionRateLimitMiddleware('view'),
  asyncHandler(getAdoptionRequestStats)
);

/**
 * @route   GET /admin/adoption-requests/follow-up
 * @desc    Get adoption requests requiring follow-up
 * @access  Admin/Staff
 */
router.get('/adoption-requests/follow-up',
  authenticate,
  requireRole(['admin', 'super_admin', 'staff']),
  adoptionRateLimitMiddleware('view'),
  asyncHandler(getFollowUpRequests)
);

/**
 * @route   POST /admin/adoption-requests
 * @desc    Create a new adoption request
 * @access  Private (Authenticated users)
 * @body    {string} petId - Pet ObjectId (required)
 * @body    {string} applicantName - Full name (required, max 100 chars)
 * @body    {string} applicantEmail - Email address (required, valid format)
 * @body    {string} applicantPhone - Phone number (required, min 10 digits)
 * @body    {string} address - Complete address (required, 10-500 chars)
 * @body    {string} housingType - Type of housing (required: house, apartment, condo, townhouse, other)
 * @body    {boolean} [hasYard] - Whether applicant has a yard
 * @body    {boolean} [hasPets] - Whether applicant has other pets
 * @body    {string} [experience] - Pet care experience (optional, max 1000 chars)
 * @body    {string} reason - Reason for adoption (required, 20-1000 chars)
 */
router.post('/adoption-requests',
  authenticate,
  adoptionRateLimitMiddleware('create'),
  adoptionValidationMiddleware(),
  asyncHandler(createAdoptionRequest)
);

/**
 * @route   GET /admin/adoption-requests
 * @desc    Get all adoption requests with filtering and pagination
 * @access  Admin
 * @query   {string} [status] - Filter by status (pending, approved, rejected, interview, completed)
 * @query   {string} [petId] - Filter by specific pet
 * @query   {number} [page] - Page number for pagination
 * @query   {number} [limit] - Number of requests per page
 * @query   {string} [sortBy] - Sort field (createdAt, status, applicantName)
 * @query   {string} [sortOrder] - Sort order (asc, desc)
 */
router.get('/adoption-requests',
  authenticate,
  adoptionAuthorizationMiddleware,
  adoptionRateLimitMiddleware('view'),
  asyncHandler(getAllAdoptionRequests)
);
/**
 * @route   GET /admin/adoption-requests/:id
 * @desc    Get specific adoption request by ID
 * @access  Admin/Staff
 * @param   {string} id - Adoption request ObjectId
 */
router.get('/adoption-requests/:id',
  authenticate,
  adoptionAuthorizationMiddleware,
  adoptionRateLimitMiddleware('view'),
  adoptionValidationMiddleware(),
  asyncHandler(getAdoptionRequestById)
);
/**
 * @route   PATCH /admin/adoption-requests/:id
 * @desc    Update adoption request status
 * @access  Admin
 * @param   {string} id - Adoption request ObjectId
 * @body    {string} status - New status (pending, approved, rejected, interview, completed)
 * @body    {string} [adminNotes] - Admin notes for the status change
 * @body    {string} [rejectionReason] - Reason for rejection (required if status is 'rejected')
 */
router.patch('/adoption-requests/:id',
  authenticate,
  adoptionAuthorizationMiddleware,
  adoptionRateLimitMiddleware('update'),
  adoptionValidationMiddleware(),
  asyncHandler(updateAdoptionRequestStatus)
);
/**
 * @route   POST /admin/adoption-requests/:id/communication
 * @desc    Add communication log entry
 * @access  Admin/Staff
 * @param   {string} id - Adoption request ObjectId
 * @body    {string} type - Communication type
 * @body    {string} message - Communication message
 */
router.post('/adoption-requests/:id/communication',
  authenticate,
  adoptionAuthorizationMiddleware,
  adoptionRateLimitMiddleware('update'),
  asyncHandler(addCommunicationLog)
);

// Apply error handler after all routes
router.use(routeErrorHandler);

export default router;