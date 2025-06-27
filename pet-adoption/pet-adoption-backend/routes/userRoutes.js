// (intentionally left blank, remove the entire duplicate block above)
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import logger from '../services/logger.js';

// Import user management controllers (not auth controllers)
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import express from 'express';

// Import middleware (adjust paths based on your structure)
import { authenticate, requireRole } from '../middleware/authenticate.js';

const router = express.Router();

// ================================================================
// MIDDLEWARE SETUP
// ================================================================

/**
 * Async handler wrapper to catch promise rejections
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate limiting configurations for user management
 */
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => 
  rateLimit({
    windowMs,
    max,
    message: { 
      error: 'Rate limit exceeded', 
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use user ID + IP for authenticated requests, just IP for others
      return req.user ? `${req.user._id}:${req.ip}` : req.ip;
    },
    handler: (req, res) => {
      logger.warn('User management rate limit exceeded', {
        ip: req.ip,
        userId: req.user?._id,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method
      });
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });

// Different rate limits for different operation types
const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests, please try again later'
);

const adminRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  50, // 50 admin operations per hour
  'Too many administrative operations, please try again later'
);

const bulkRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  5, // 5 bulk operations per hour
  'Too many bulk operations, please try again later'
);

const sensitiveRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 sensitive operations per hour
  'Too many sensitive operations, please try again later'
);

const exportRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 exports per hour
  'Too many export requests, please try again later'
);

/**
 * Validation middleware that handles express-validator results
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      userId: req.user?._id,
      endpoint: req.originalUrl,
      ip: req.ip
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please correct the following errors',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Permission middleware for different operations
 */
const requirePermission = (operation) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    const permissions = {
      'view_users': ['staff', 'admin', 'super_admin'],
      'create_users': ['admin', 'super_admin'],
      'update_users': ['admin', 'super_admin'],
      'delete_users': ['admin', 'super_admin'],
      'bulk_operations': ['super_admin'],
      'sensitive_operations': ['super_admin'],
      'export_data': ['admin', 'super_admin'],
      'view_stats': ['staff', 'admin', 'super_admin']
    };
    
    if (!permissions[operation] || !permissions[operation].includes(userRole)) {
      logger.warn('Insufficient permissions', {
        userId: req.user._id,
        userRole,
        requiredOperation: operation,
        endpoint: req.originalUrl,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `You do not have permission to ${operation.replace('_', ' ')}`
      });
    }
    
    next();
  };
};

/**
 * Audit logging middleware for important operations
 */
const auditLog = (operation) => {
  return (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the operation
      logger.info('User management operation', {
        operation,
        userId: req.user._id,
        userRole: req.user.role,
        targetUserId: req.params.id,
        success: res.statusCode < 400,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        requestBody: req.method !== 'GET' ? req.body : undefined
      });
      
      // Call original json method
      originalJson.call(this, data);
    };
    
    next();
  };
};

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

// MongoDB ObjectId validation
const objectIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format')
    .customSanitizer(value => value.toString())
];

// User creation validation
const createUserValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email must be less than 254 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('role')
    .isIn(['user', 'volunteer', 'foster', 'staff', 'admin', 'super_admin'])
    .withMessage('Invalid role specified'),
  
  // Profile validation (optional fields)
  body('profile.firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]*$/)
    .withMessage('First name contains invalid characters'),
  
  body('profile.lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]*$/)
    .withMessage('Last name contains invalid characters'),
  
  body('profile.phone')
  .optional()
  .isLength({ min: 0, max: 20 })
  .withMessage('Phone number must be less than 20 characters')
  .matches(/^[\+]?[0-9\s\-\(\)\.]*$/)
  .withMessage('Phone number contains invalid characters'),
  
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  
  // Address validation (optional fields)
  body('address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address must be less than 200 characters'),
  
  body('address.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s\-'\.]*$/)
    .withMessage('City name contains invalid characters'),
  
  body('address.zip')
    .optional()
    .isLength({ max: 20 })
    .withMessage('ZIP code must be less than 20 characters')
    .matches(/^[a-zA-Z0-9\s\-]*$/)
    .withMessage('ZIP code contains invalid characters'),
  
  body('address.country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters')
];

// User update validation (all fields optional except ID)
const updateUserValidation = [
  ...objectIdValidation,
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .trim(),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('role')
    .optional()
    .isIn(['user', 'volunteer', 'foster', 'staff', 'admin', 'super_admin'])
    .withMessage('Invalid role specified'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'banned', 'pending_verification'])
    .withMessage('Invalid status specified')
];

// Query parameter validation for listing users
const getUsersQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be a positive integer between 1 and 10000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters')
    .trim()
    .escape(),
  
  query('role')
    .optional()
    .isIn(['user', 'volunteer', 'foster', 'staff', 'admin', 'super_admin'])
    .withMessage('Invalid role filter'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'banned', 'pending_verification'])
    .withMessage('Invalid status filter'),
  
  query('sortBy')
    .optional()
    .isIn(['username', 'email', 'role', 'status', 'createdAt', 'lastLogin'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('emailVerified')
    .optional()
    .isBoolean()
    .withMessage('Email verified filter must be boolean')
    .toBoolean(),
  
  query('isVolunteer')
    .optional()
    .isBoolean()
    .withMessage('Volunteer filter must be boolean')
    .toBoolean()
];

// Bulk operations validation
const bulkUpdateValidation = [
  body('userIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('User IDs must be an array with 1-100 items'),
  
  body('userIds.*')
    .isMongoId()
    .withMessage('All user IDs must be valid MongoDB ObjectIds'),
  
  body('updateData')
    .isObject()
    .withMessage('Update data must be an object')
    .custom((value) => {
      if (Object.keys(value).length === 0) {
        throw new Error('Update data cannot be empty');
      }
      return true;
    })
];

// Password change validation
const passwordChangeValidation = [
  ...objectIdValidation,
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
    .trim()
];

// Status toggle validation
const statusToggleValidation = [
  ...objectIdValidation,
  
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
    .trim()
];

// Export validation
const exportValidation = [
  query('format')
    .optional()
    .isIn(['csv', 'json'])
    .withMessage('Export format must be csv or json'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters')
    .trim()
    .escape()
];

// Statistics validation
const statsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
    .toInt()
];

// ================================================================
// ROUTES DEFINITION
// ================================================================

// Apply authentication to all routes
router.use(authenticate);

// ================================================================
// USER LISTING AND STATISTICS ROUTES
// ================================================================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Staff+)
 */
router.get('/',
  generalRateLimit,
  requirePermission('view_users'),
  getUsersQueryValidation,
  validateRequest,
  auditLog('list_users'),
  asyncHandler(getAllUsers)
);


// ================================================================
// INDIVIDUAL USER ROUTES
// ================================================================

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Staff+)
 */
router.get('/:id',
  generalRateLimit,
  requirePermission('view_users'),
  objectIdValidation,
  validateRequest,
  auditLog('view_user'),
  asyncHandler(getUserById)
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin+)
 */
router.post('/',
  adminRateLimit,
  requirePermission('create_users'),
  createUserValidation,
  validateRequest,
  auditLog('create_user'),
  asyncHandler(createUser)
);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Admin+)
 */
router.patch('/:id',
  adminRateLimit,
  requirePermission('update_users'),
  updateUserValidation,
  validateRequest,
  auditLog('update_user'),
  asyncHandler(updateUser)
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID (soft delete by default)
 * @access  Private (Admin+)
 */
router.delete('/:id',
  sensitiveRateLimit,
  requirePermission('delete_users'),
  objectIdValidation,
  validateRequest,
  auditLog('delete_user'),
  asyncHandler(deleteUser)
);

// ================================================================
// ERROR HANDLING
// ================================================================

/**
 * Route-specific error handler
 */
router.use((error, req, res, next) => {
  logger.error('User management route error', {
    error: error.message,
    stack: error.stack,
    route: req.path,
    method: req.method,
    userId: req.user?._id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'Invalid user ID format'
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      error: 'Duplicate entry',
      message: `An account with this ${field} already exists`
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is invalid or expired'
    });
  }

  // Pass to global error handler
  next(error);
});

/**
 * 404 handler for undefined routes
 */
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

export default router;