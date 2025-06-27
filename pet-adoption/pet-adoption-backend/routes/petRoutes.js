import express from 'express';
import { getAllPets, createPet, getPetById, updatePet, submitInquiry } from '../controllers/petController.js';
import Pet from '../models/Pet.js';
import logger from '../services/logger.js';
import { authenticate, isAdmin } from '../middleware/authenticate.js';

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
 * Middleware for request validation and logging
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestMiddleware = (req, res, next) => {
  // Log incoming request
  logger.debug('Pet route accessed', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    params: req.params,
    query: req.query
  });

  // Validate ObjectId format for routes with :id parameter
  if (req.params.id || req.params.petId) {
    const idToValidate = req.params.id || req.params.petId;
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdRegex.test(idToValidate)) {
      logger.warn('Invalid ObjectId format', {
        providedId: idToValidate,
        ip: req.ip,
        path: req.path
      });
      return res.status(400).json({
        error: 'Invalid ID format',
        message: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }
  }

  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('Invalid Content-Type for request', {
        method: req.method,
        contentType,
        ip: req.ip,
        path: req.path
      });
      return res.status(400).json({
        error: 'Invalid Content-Type',
        message: 'Content-Type must be application/json'
      });
    }
  }

  next();
};

/**
 * Delete pet controller with proper error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deletePet = async (req, res) => {
  try {
    const petId = req.params.id;
    
    logger.info('Attempting to delete pet', { 
      petId, 
      adminUser: req.user?.id,
      ip: req.ip 
    });

    // Check if pet exists before deletion
    const pet = await Pet.findById(petId);
    if (!pet) {
      logger.warn('Pet not found for deletion', { 
        petId, 
        adminUser: req.user?.id 
      });
      return res.status(404).json({
        error: 'Pet not found',
        message: 'The requested pet does not exist'
      });
    }

    // Log pet details before deletion for audit trail
    logger.info('Pet found for deletion', {
      petId,
      petName: pet.name,
      petType: pet.type,
      adminUser: req.user?.id
    });

    // Perform deletion
    await Pet.findByIdAndDelete(petId);
    logger.dbLog('delete', 'pets', { petId, deletedBy: req.user?.id });

    logger.info('Pet deleted successfully', { 
      petId, 
      adminUser: req.user?.id 
    });

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully',
      deletedPetId: petId
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'deletePet',
      petId: req.params.id,
      adminUser: req.user?.id,
      ip: req.ip
    });

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid Pet ID',
        message: 'The provided pet ID format is invalid'
      });
    }

    res.status(500).json({
      error: 'Delete operation failed',
      message: 'An error occurred while deleting the pet'
    });
  }
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
    route: 'pets',
    method: req.method,
    path: req.path,
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id
  });

  // Handle specific error types
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
      message: 'Invalid data type or ID format provided'
    });
  }

  if (error.code === 11000) { // MongoDB duplicate key error
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A pet with this data already exists'
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Pass to global error handler
  next(error);
};

// Apply middleware to all routes in this router
router.use(requestMiddleware);

/**
 * @route   GET /api/pets
 * @desc    Get all pets with optional filtering and pagination
 * @access  Public
 * @query   {string} type - Filter by pet type
 * @query   {string} status - Filter by adoption status
 * @query   {number} page - Page number for pagination
 * @query   {number} limit - Number of items per page
 */
router.get('/', asyncHandler(getAllPets));

/**
 * @route   POST /api/pets
 * @desc    Create a new pet listing
 * @access  Admin
 * @body    {Object} petData - The pet information
 */
router.post('/', authenticate, isAdmin, asyncHandler(createPet));

/**
 * @route   GET /api/pets/:id
 * @desc    Get a specific pet by ID
 * @access  Public
 * @param   {string} id - Pet ObjectId
 */
router.get('/:id', asyncHandler(getPetById));

/**
 * @route   POST /api/pets/:petId/inquiry
 * @desc    Submit an inquiry for a specific pet
 * @access  Public
 * @param   {string} petId - Pet ObjectId
 * @body    {Object} inquiryData - The inquiry information
 */
router.post('/:petId/inquiry', asyncHandler(submitInquiry));

/**
 * @route   PUT /api/pets/:id
 * @desc    Update a pet listing
 * @access  Admin
 * @param   {string} id - Pet ObjectId
 * @body    {Object} updateData - The updated pet information
 */
router.put('/:id', authenticate, isAdmin, asyncHandler(updatePet));

/**
 * @route   DELETE /api/pets/:id
 * @desc    Delete a pet listing
 * @access  Admin
 * @param   {string} id - Pet ObjectId
 */
router.delete('/:id', authenticate, isAdmin, asyncHandler(deletePet));

// Apply error handler after all routes
router.use(routeErrorHandler);

export default router;
