import express from 'express';
import { body, param, query } from 'express-validator';
import { createRequest } from '../controllers/postRequestController.js';
import { authenticate, optionalAuth } from '../middleware/authenticate.js';

const router = express.Router();

// Validation middleware for adoption request creation
const validateAdoptionRequest = [
  body('pet')
    .isMongoId()
    .withMessage('Valid pet ID is required'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  
  body('phone')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Valid phone number is required'),
  
  body('address.street')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
  
  body('address.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('City can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('address.region')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State/Region must be between 2 and 50 characters'),
  
  body('address.zip')
    .trim()
    .matches(/^[0-9]{5}(-[0-9]{4})?$|^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/)
    .withMessage('Valid ZIP/Postal code is required'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  
  body('when')
    .optional()
    .isIn(['asap', 'within_month', 'within_3_months', 'flexible'])
    .withMessage('Invalid timeline selection'),
  
  // Living Environment Validation
  body('livingEnvironment.type')
    .optional()
    .isIn(['house', 'apartment', 'condo', 'townhouse', 'other'])
    .withMessage('Invalid living environment type'),
  
  body('livingEnvironment.hasYard')
    .optional()
    .isBoolean()
    .withMessage('Yard information must be true or false'),
  
  body('livingEnvironment.yardSize')
    .optional()
    .isIn(['none', 'small', 'medium', 'large'])
    .withMessage('Invalid yard size'),
  
  body('livingEnvironment.rentOrOwn')
    .optional()
    .isIn(['rent', 'own'])
    .withMessage('Must specify rent or own'),
  
  body('livingEnvironment.landlordApproval')
    .optional()
    .isBoolean()
    .withMessage('Landlord approval must be true or false'),
  
  // Experience Validation
  body('experience.hadPetsBefore')
    .optional()
    .isBoolean()
    .withMessage('Pet experience must be true or false'),
  
  body('experience.currentPets')
    .optional()
    .isInt({ min: 0, max: 20 })
    .withMessage('Number of current pets must be between 0 and 20'),
  
  body('experience.veterinarian')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Veterinarian information cannot exceed 200 characters'),
  
  // Other Pets Validation
  body('otherPets')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Cannot have more than 10 other pets listed'),
  
  body('otherPets.*.type')
    .optional()
    .isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'])
    .withMessage('Invalid pet type'),
  
  body('otherPets.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Pet name must be between 1 and 50 characters'),
  
  body('otherPets.*.age')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Pet age must be between 0 and 30 years'),
  
  // References Validation
  body('references')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Cannot have more than 3 references'),
  
  body('references.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Reference name must be between 2 and 100 characters'),
  
  body('references.*.relationship')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Relationship must be between 2 and 50 characters'),
  
  body('references.*.phone')
    .optional()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Valid phone number required for reference'),
  
  body('references.*.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required for reference')
];

// Validation for getting user requests
const validateGetUserRequests = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  
  query('status')
    .optional()
    .isIn(['pending', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'cancelled', 'completed'])
    .withMessage('Invalid status filter'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation for canceling request
const validateCancelRequest = [
  param('requestId')
    .isMongoId()
    .withMessage('Valid request ID is required'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
];

// Simple in-memory rate limiting (basic implementation)
// For production, consider using Redis or express-rate-limit
const requestCounts = new Map();

const simpleRateLimit = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3;

  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, []);
  }

  const requests = requestCounts.get(clientId);
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many adoption requests. Please wait before submitting another request.',
      retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
    });
  }

  validRequests.push(now);
  requestCounts.set(clientId, validRequests);
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    for (const [key, times] of requestCounts.entries()) {
      const validTimes = times.filter(time => now - time < windowMs);
      if (validTimes.length === 0) {
        requestCounts.delete(key);
      } else {
        requestCounts.set(key, validTimes);
      }
    }
  }
  
  next();
};

// Routes

/**
 * @route   POST /api/adoption-requests
 * @desc    Create a new adoption request
 * @access  Public (with rate limiting)
 */
router.post('/', 
  simpleRateLimit, // Using simple in-memory rate limiting
  optionalAuth, // Optional authentication - works for both logged in and guest users
  validateAdoptionRequest,
  createRequest
);

// TODO: Add these routes when the controller functions are implemented
/*
router.get('/user/:userId',
  authenticate,
  validateGetUserRequests,
  getUserRequests
);

router.patch('/:requestId/cancel',
  authenticate,
  validateCancelRequest,
  cancelRequest
);

router.get('/my-requests',
  authenticate,
  query('status').optional().isIn(['pending', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'cancelled', 'completed']),
  query('page').optional().isInt({ min: 1, max: 1000 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    req.params.userId = req.user.id;
    next();
  },
  getUserRequests
);
*/

export default router;