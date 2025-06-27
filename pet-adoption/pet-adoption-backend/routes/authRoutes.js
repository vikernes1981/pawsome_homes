import express from 'express';
import { 
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  refreshToken,
  getCurrentUser,
  updateProfile
} from '../controllers/authController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import logger from '../services/logger.js';

const router = express.Router();

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
 * Rate limiting for authentication endpoints
 */
const authRateLimitMap = new Map();
const RATE_LIMITS = {
  login: { window: 15 * 60 * 1000, maxAttempts: 5 },
  register: { window: 60 * 60 * 1000, maxAttempts: 3 },
  forgotPassword: { window: 60 * 60 * 1000, maxAttempts: 3 },
  general: { window: 60 * 1000, maxAttempts: 10 }
};

/**
 * Rate limiting middleware for authentication routes
 */
const authRateLimitMiddleware = (operation = 'general') => {
  return (req, res, next) => {
    const clientIp = req.ip;
    const now = Date.now();
    const limits = RATE_LIMITS[operation];
    
    // Clean up old entries
    for (const [key, data] of authRateLimitMap.entries()) {
      if (now - data.firstAttempt > limits.window) {
        authRateLimitMap.delete(key);
      }
    }
    
    const rateLimitKey = `${clientIp}:${operation}`;
    const attemptData = authRateLimitMap.get(rateLimitKey);
    
    if (!attemptData) {
      authRateLimitMap.set(rateLimitKey, {
        firstAttempt: now,
        attempts: 1
      });
      next();
    } else if (now - attemptData.firstAttempt > limits.window) {
      authRateLimitMap.set(rateLimitKey, {
        firstAttempt: now,
        attempts: 1
      });
      next();
    } else if (attemptData.attempts >= limits.maxAttempts) {
      logger.warn(`Auth rate limit exceeded for ${operation}`, {
        ip: clientIp,
        operation,
        attempts: attemptData.attempts,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many ${operation} attempts. Please try again later.`,
        retryAfter: Math.ceil((limits.window - (now - attemptData.firstAttempt)) / 1000)
      });
    } else {
      attemptData.attempts++;
      next();
    }
  };
};

/**
 * Basic input validation middleware
 */
const basicValidationMiddleware = (requiredFields = []) => {
  return (req, res, next) => {
    // Validate Content-Type for POST/PATCH requests
    if (['POST', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
          error: 'Invalid Content-Type',
          message: 'Content-Type must be application/json'
        });
      }

      // Check for empty request body
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: 'Empty request body',
          message: 'Request body is required'
        });
      }
    }

    // Check required fields
    const errors = [];
    for (const field of requiredFields) {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim().length === 0)) {
        errors.push(`${field} is required`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors',
        details: errors
      });
    }

    next();
  };
};

/**
 * Route-specific error handler
 */
const routeErrorHandler = (error, req, res, next) => {
  logger.error('Auth route error:', {
    error: error.message,
    stack: error.stack,
    route: req.path,
    method: req.method,
    ip: req.ip
  });

  // Handle specific authentication errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Account already exists',
      message: 'An account with this email or username already exists'
    });
  }

  // Pass to global error handler
  next(error);
};

// PUBLIC ROUTES - No authentication required

/**
 * @route   POST /api/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', 
  authRateLimitMiddleware('register'),
  basicValidationMiddleware(['email', 'password']),
  asyncHandler(registerUser)
);

/**
 * @route   POST /api/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', 
  authRateLimitMiddleware('login'),
  basicValidationMiddleware(['email', 'password']),
  asyncHandler(loginUser)
);

/**
 * @route   POST /api/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', 
  authRateLimitMiddleware('forgotPassword'),
  basicValidationMiddleware(['email']),
  asyncHandler(requestPasswordReset)
);

/**
 * @route   POST /api/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', 
  authRateLimitMiddleware('forgotPassword'),
  basicValidationMiddleware(['token', 'newPassword']),
  asyncHandler(resetPassword)
);

/**
 * @route   POST /api/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', 
  authRateLimitMiddleware('general'),
  basicValidationMiddleware(['token']),
  asyncHandler(verifyEmail)
);

/**
 * @route   POST /api/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', 
  authRateLimitMiddleware('general'),
  basicValidationMiddleware(['refreshToken']),
  asyncHandler(refreshToken)
);

// PROTECTED ROUTES - Authentication required

/**
 * @route   GET /api/user
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get('/user', 
  authenticate,
  authRateLimitMiddleware(),
  asyncHandler(getCurrentUser)
);

/**
 * @route   PATCH /api/user/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/user/profile', 
  authenticate,
  authRateLimitMiddleware(),
  asyncHandler(updateProfile)
);

// Apply error handler after all routes
router.use(routeErrorHandler);

export default router;