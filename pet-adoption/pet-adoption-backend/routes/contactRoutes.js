import express from 'express';
import { sendContactMessage } from '../controllers/contactController.js';
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
 * Rate limiting tracking for contact form submissions
 * Simple in-memory rate limiting (consider Redis for production scaling)
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 3; // 3 requests per 15 minutes per IP

/**
 * Rate limiting middleware for contact form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const rateLimitMiddleware = (req, res, next) => {
  const clientIp = req.ip;
  const now = Date.now();
  
  // Clean up old entries
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
  
  const clientData = rateLimitMap.get(clientIp);
  
  if (!clientData) {
    // First request from this IP
    rateLimitMap.set(clientIp, {
      firstRequest: now,
      requestCount: 1
    });
    next();
  } else if (now - clientData.firstRequest > RATE_LIMIT_WINDOW) {
    // Window has expired, reset
    rateLimitMap.set(clientIp, {
      firstRequest: now,
      requestCount: 1
    });
    next();
  } else if (clientData.requestCount >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    logger.warn('Contact form rate limit exceeded', {
      ip: clientIp,
      requestCount: clientData.requestCount,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many contact requests. Please wait ${Math.ceil((RATE_LIMIT_WINDOW - (now - clientData.firstRequest)) / 60000)} minutes before trying again.`,
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientData.firstRequest)) / 1000)
    });
  } else {
    // Within rate limit, increment counter
    clientData.requestCount++;
    next();
  }
};

/**
 * Contact form validation middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const contactValidationMiddleware = (req, res, next) => {
  // Log incoming contact request
  logger.info('Contact form submission attempt', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    hasBody: !!req.body && Object.keys(req.body).length > 0
  });

  // Validate Content-Type
  const contentType = req.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn('Invalid Content-Type for contact form', {
      contentType,
      ip: req.ip
    });
    return res.status(400).json({
      error: 'Invalid Content-Type',
      message: 'Content-Type must be application/json'
    });
  }

  // Check for empty request body
  if (!req.body || Object.keys(req.body).length === 0) {
    logger.warn('Empty contact form submission', {
      ip: req.ip
    });
    return res.status(400).json({
      error: 'Empty request body',
      message: 'Contact form data is required'
    });
  }

  // Basic field validation
  const { name, email, message } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Valid email address is required');
    } else if (email.trim().length > 254) {
      errors.push('Email must be less than 254 characters');
    }
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push('Message is required');
  } else if (message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  } else if (message.trim().length > 2000) {
    errors.push('Message must be less than 2000 characters');
  }

  // Check for suspicious content (basic spam prevention)
  const suspiciousPatterns = [
    /https?:\/\/[^\s]+/gi, // URLs
    /\b(viagra|cialis|loan|casino|poker)\b/gi, // Common spam keywords
    /(.)\1{10,}/g // Repeated characters (like aaaaaaaaaa)
  ];

  const fullText = `${name} ${email} ${message}`.toLowerCase();
  const suspiciousContent = suspiciousPatterns.some(pattern => pattern.test(fullText));

  if (suspiciousContent) {
    logger.warn('Suspicious contact form content detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      name: name?.substring(0, 50),
      email: email?.substring(0, 50)
    });
    return res.status(400).json({
      error: 'Invalid content',
      message: 'Message contains invalid content'
    });
  }

  if (errors.length > 0) {
    logger.warn('Contact form validation failed', {
      errors,
      ip: req.ip,
      providedFields: Object.keys(req.body)
    });
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please correct the following errors',
      details: errors
    });
  }

  // Sanitize and trim inputs
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.message = message.trim();

  next();
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
    route: 'contact',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: {
      name: req.body?.name?.substring(0, 50),
      email: req.body?.email?.substring(0, 50),
      messageLength: req.body?.message?.length
    }
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.errors || {}
    });
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    logger.error('Email service unavailable', {
      error: error.message,
      code: error.code
    });
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Unable to send message at this time. Please try again later.'
    });
  }

  if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
    return res.status(429).json({
      error: 'Service limit exceeded',
      message: 'Message sending limit reached. Please try again later.'
    });
  }

  // Pass to global error handler
  next(error);
};

/**
 * @route   POST /contact
 * @desc    Send a contact message
 * @access  Public
 * @body    {Object} contactData - Contact form data
 * @body    {string} contactData.name - Sender's name (required, max 100 chars)
 * @body    {string} contactData.email - Sender's email (required, valid email format)
 * @body    {string} contactData.message - Message content (required, 10-2000 chars)
 * @body    {string} [contactData.subject] - Optional subject line
 * @body    {string} [contactData.phone] - Optional phone number
 */
router.post('/', 
  rateLimitMiddleware,
  contactValidationMiddleware,
  asyncHandler(sendContactMessage)
);

// Apply error handler after all routes
router.use(routeErrorHandler);

export default router;
