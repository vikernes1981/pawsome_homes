import express from 'express';
import { handleChatbotMessage } from '../controllers/chatbotController.js';
import logger from '../services/logger.js';

const router = express.Router();
router.use(express.json());
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
 * Rate limiting for chatbot interactions
 * Prevents abuse while allowing normal conversation flow
 */
const chatRateLimitMap = new Map();
const CHAT_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 20; // 20 messages per minute per IP
const BURST_LIMIT = 5; // Allow 5 rapid messages, then apply rate limiting

/**
 * Rate limiting middleware for chatbot messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const chatRateLimitMiddleware = (req, res, next) => {
  const clientIp = req.ip;
  const now = Date.now();
  
  // Clean up old entries
  for (const [ip, data] of chatRateLimitMap.entries()) {
    if (now - data.windowStart > CHAT_RATE_LIMIT_WINDOW) {
      chatRateLimitMap.delete(ip);
    }
  }
  
  const clientData = chatRateLimitMap.get(clientIp);
  
  if (!clientData) {
    // First message from this IP
    chatRateLimitMap.set(clientIp, {
      windowStart: now,
      messageCount: 1,
      lastMessage: now
    });
    next();
  } else if (now - clientData.windowStart > CHAT_RATE_LIMIT_WINDOW) {
    // Window has expired, reset
    chatRateLimitMap.set(clientIp, {
      windowStart: now,
      messageCount: 1,
      lastMessage: now
    });
    next();
  } else if (clientData.messageCount >= MAX_MESSAGES_PER_WINDOW) {
    // Rate limit exceeded
    logger.warn('Chatbot rate limit exceeded', {
      ip: clientIp,
      messageCount: clientData.messageCount,
      userAgent: req.get('User-Agent'),
      sessionId: req.body?.sessionId
    });
    
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many messages sent. Please slow down and try again in a moment.',
      retryAfter: Math.ceil((CHAT_RATE_LIMIT_WINDOW - (now - clientData.windowStart)) / 1000),
      suggestion: 'Take a moment to read my previous responses before continuing our conversation.'
    });
  } else {
    // Check for rapid-fire messages (potential spam)
    const timeSinceLastMessage = now - clientData.lastMessage;
    if (clientData.messageCount > BURST_LIMIT && timeSinceLastMessage < 2000) {
      logger.warn('Rapid chatbot message detected', {
        ip: clientIp,
        timeSinceLastMessage,
        messageCount: clientData.messageCount
      });
      
      return res.status(429).json({
        error: 'Sending too quickly',
        message: 'Please wait a moment between messages to ensure quality conversation.',
        retryAfter: 2
      });
    }
    
    // Within rate limit, update counters
    clientData.messageCount++;
    clientData.lastMessage = now;
    next();
  }
};

/**
 * Chatbot message validation middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const chatValidationMiddleware = (req, res, next) => {
  // Log incoming chatbot interaction
  logger.debug('Chatbot message received', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    sessionId: req.body?.sessionId,
    messageLength: req.body?.message?.length,
    hasContext: !!req.body?.context
  });

  // Validate Content-Type
  const contentType = req.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    logger.warn('Invalid Content-Type for chatbot message', {
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
    logger.warn('Empty chatbot message received', {
      ip: req.ip
    });
    return res.status(400).json({
      error: 'Empty request body',
      message: 'Message data is required'
    });
  }

  // Validate required fields
  const { message, sessionId } = req.body;
  const errors = [];

  if (!message || typeof message !== 'string') {
    errors.push('Message is required and must be a string');
  } else {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      errors.push('Message cannot be empty');
    } else if (trimmedMessage.length > 1000) {
      errors.push('Message must be less than 1000 characters');
    } else if (trimmedMessage.length < 1) {
      errors.push('Message must contain at least 1 character');
    }
  }

  // Session ID validation (optional but recommended)
  if (sessionId && typeof sessionId !== 'string') {
    errors.push('Session ID must be a string');
  } else if (sessionId && sessionId.length > 100) {
    errors.push('Session ID must be less than 100 characters');
  }

  // Check for potentially harmful content
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /data:text\/html/gi, // Data URLs
    /(\bfuck\b|\bshit\b|\bdamn\b|\bass\b)/gi // Basic profanity filter
  ];

  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(message));
  if (hasSuspiciousContent) {
    logger.warn('Suspicious chatbot message content detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId,
      messagePreview: message?.substring(0, 100)
    });
    return res.status(400).json({
      error: 'Invalid content',
      message: 'Message contains inappropriate or potentially harmful content'
    });
  }

  // Check for excessive repeated characters or spam patterns
  const spamPatterns = [
    /(.)\1{10,}/g, // Repeated characters
    /^(.{1,10})\1{5,}$/g, // Repeated phrases
    /^\s*[A-Z\s!]{20,}\s*$/g // All caps with excessive length
  ];

  const isSpam = spamPatterns.some(pattern => pattern.test(message));
  if (isSpam) {
    logger.warn('Spam pattern detected in chatbot message', {
      ip: req.ip,
      sessionId,
      messageLength: message.length
    });
    return res.status(400).json({
      error: 'Spam detected',
      message: 'Please send meaningful messages for better assistance'
    });
  }

  if (errors.length > 0) {
    logger.warn('Chatbot message validation failed', {
      errors,
      ip: req.ip,
      sessionId,
      providedFields: Object.keys(req.body)
    });
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please correct the following errors',
      details: errors
    });
  }

  // Sanitize inputs
  req.body.message = message.trim();
  if (sessionId) {
    req.body.sessionId = sessionId.trim();
  }

  next();
};

/**
 * Route-specific error handler for chatbot routes
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const routeErrorHandler = (error, req, res, next) => {
  logger.errorLog(error, {
    route: 'chatbot',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    sessionId: req.body?.sessionId,
    messageLength: req.body?.message?.length
  });

  // Handle specific chatbot-related errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid message format',
      details: error.errors || {},
      suggestion: 'Please check your message and try again'
    });
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    logger.error('Chatbot service unavailable', {
      error: error.message,
      code: error.code
    });
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'The chatbot service is currently unavailable. Please try again in a few moments.',
      suggestion: 'You can also try contacting us through our contact form'
    });
  }

  if (error.message?.includes('timeout')) {
    return res.status(504).json({
      error: 'Response timeout',
      message: 'The chatbot is taking longer than expected to respond. Please try again.',
      suggestion: 'Try asking a simpler question or rephrase your message'
    });
  }

  if (error.message?.includes('quota') || error.message?.includes('limit')) {
    return res.status(429).json({
      error: 'Service limit reached',
      message: 'The chatbot service has reached its usage limit. Please try again later.',
      suggestion: 'Consider using our contact form for immediate assistance'
    });
  }

  // Pass to global error handler
  next(error);
};

/**
 * @route   POST /chatbot/message
 * @desc    Send a message to the chatbot and receive a response
 * @access  Public
 * @body    {Object} messageData - Chatbot message data
 * @body    {string} messageData.message - User message (required, 1-1000 chars)
 * @body    {string} [messageData.sessionId] - Session identifier for conversation context
 * @body    {Object} [messageData.context] - Additional context for the conversation
 * @body    {string} [messageData.userId] - User identifier (if authenticated)
 */
router.post('/message', 
  chatRateLimitMiddleware,
  chatValidationMiddleware,
  asyncHandler(handleChatbotMessage)
);

/**
 * @route   GET /chatbot/health
 * @desc    Check chatbot service health
 * @access  Public
 */
router.get('/health', (req, res) => {
  logger.debug('Chatbot health check', { ip: req.ip });
  
  res.status(200).json({
    status: 'operational',
    service: 'chatbot',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Apply error handler after all routes
router.use(routeErrorHandler);

export default router;
