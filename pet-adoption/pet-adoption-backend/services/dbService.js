import User from '../models/User.js';
import logger from '../services/logger.js';

/**
 * User Service
 * Handles user registration and retrieval operations
 */

/**
 * Register or retrieve a user by their user ID
 * @param {string} userId - The unique identifier for the user
 * @returns {Promise<Object>} The user object
 * @throws {Error} If userId is invalid or database operation fails
 */
const registerUser = async (userId) => {
  try {
    // Input validation
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (typeof userId !== 'string') {
      throw new Error('User ID must be a string');
    }

    if (userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    const trimmedUserId = userId.trim();
    
    // Check if user already exists
    let user = await User.findOne({ userId: trimmedUserId });
    logger.dbLog('findOne', 'users', { userId: trimmedUserId });
    
    if (!user) {
      logger.info('Creating new user', { userId: trimmedUserId });
      
      user = new User({ userId: trimmedUserId });
      await user.save();
      logger.dbLog('save', 'users', { userId: trimmedUserId, operation: 'create' });
      
      logger.info('User created successfully', { userId: trimmedUserId });
    } else {
      logger.debug('User already exists', { userId: trimmedUserId });
    }

    return user;
  } catch (error) {
    logger.errorLog(error, {
      operation: 'registerUser',
      userId,
      errorType: error.name
    });

    // Re-throw with more context for database errors
    if (error.name === 'ValidationError') {
      throw new Error(`User validation failed: ${error.message}`);
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      throw new Error(`Database operation failed: ${error.message}`);
    }

    // For custom validation errors, throw as-is
    if (error.message.includes('User ID')) {
      throw error;
    }

    throw new Error(`registerUser failed: ${error.message}`);
  }
};

/**
 * Get user by their user ID
 * @param {string} userId - The unique identifier for the user
 * @returns {Promise<Object|null>} The user object or null if not found
 * @throws {Error} If userId is invalid or database operation fails
 */
const getUserById = async (userId) => {
  try {
    // Input validation
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (typeof userId !== 'string') {
      throw new Error('User ID must be a string');
    }

    if (userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    const trimmedUserId = userId.trim();
    
    logger.debug('Retrieving user', { userId: trimmedUserId });
    
    const user = await User.findOne({ userId: trimmedUserId });
    logger.dbLog('findOne', 'users', { userId: trimmedUserId, found: !!user });
    
    if (user) {
      logger.debug('User found', { userId: trimmedUserId });
    } else {
      logger.debug('User not found', { userId: trimmedUserId });
    }

    return user;
  } catch (error) {
    logger.errorLog(error, {
      operation: 'getUserById',
      userId,
      errorType: error.name
    });

    // Handle database errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      throw new Error(`Database operation failed: ${error.message}`);
    }

    // For custom validation errors, throw as-is
    if (error.message.includes('User ID')) {
      throw error;
    }

    throw new Error(`getUserById failed: ${error.message}`);
  }
};

/**
 * Check if a user exists by their user ID
 * @param {string} userId - The unique identifier for the user
 * @returns {Promise<boolean>} True if user exists, false otherwise
 * @throws {Error} If userId is invalid or database operation fails
 */
const userExists = async (userId) => {
  try {
    const user = await getUserById(userId);
    return user !== null;
  } catch (error) {
    logger.errorLog(error, {
      operation: 'userExists',
      userId,
      errorType: error.name
    });
    throw new Error(`userExists failed: ${error.message}`);
  }
};

export default {
  registerUser,
  getUserById,
  userExists
};
