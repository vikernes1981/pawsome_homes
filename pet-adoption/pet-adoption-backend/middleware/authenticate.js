import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../services/logger.js';

/**
 * Authentication Middleware
 * Comprehensive JWT authentication with security features and detailed logging
 */

/**
 * Rate limiting for authentication attempts
 * Track failed authentication attempts per IP
 */
const authAttempts = new Map();
const AUTH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 10, // 10 failed attempts per window
  lockoutMs: 30 * 60 * 1000 // 30 minute lockout
};

/**
 * Clean up old authentication attempt records
 */
const cleanupAuthAttempts = () => {
  const now = Date.now();
  for (const [ip, data] of authAttempts.entries()) {
    if (now - data.firstAttempt > AUTH_RATE_LIMIT.windowMs) {
      authAttempts.delete(ip);
    }
  }
};

/**
 * Check if IP is rate limited for authentication
 * @param {string} ip - Client IP address
 * @returns {Object} Rate limit status
 */
const checkAuthRateLimit = (ip) => {
  cleanupAuthAttempts();
  
  const now = Date.now();
  const attempts = authAttempts.get(ip);
  
  if (!attempts) {
    return { limited: false, remaining: AUTH_RATE_LIMIT.maxAttempts };
  }
  
  // Check if in lockout period
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    return { 
      limited: true, 
      lockoutRemaining: Math.ceil((attempts.lockedUntil - now) / 1000),
      reason: 'lockout'
    };
  }
  
  // Reset if window expired
  if (now - attempts.firstAttempt > AUTH_RATE_LIMIT.windowMs) {
    authAttempts.delete(ip);
    return { limited: false, remaining: AUTH_RATE_LIMIT.maxAttempts };
  }
  
  // Check if limit exceeded
  if (attempts.count >= AUTH_RATE_LIMIT.maxAttempts) {
    attempts.lockedUntil = now + AUTH_RATE_LIMIT.lockoutMs;
    return { 
      limited: true, 
      lockoutRemaining: Math.ceil(AUTH_RATE_LIMIT.lockoutMs / 1000),
      reason: 'rate_limit'
    };
  }
  
  return { 
    limited: false, 
    remaining: AUTH_RATE_LIMIT.maxAttempts - attempts.count 
  };
};

/**
 * Record failed authentication attempt
 * @param {string} ip - Client IP address
 */
const recordFailedAuth = (ip) => {
  const now = Date.now();
  const attempts = authAttempts.get(ip);
  
  if (!attempts || now - attempts.firstAttempt > AUTH_RATE_LIMIT.windowMs) {
    authAttempts.set(ip, {
      firstAttempt: now,
      count: 1
    });
  } else {
    attempts.count++;
  }
};

/**
 * Extract and validate JWT token from request
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null if invalid
 */
const extractToken = (req) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // For backwards compatibility, also accept token without Bearer prefix
  if (authHeader.length > 20 && !authHeader.includes(' ')) {
    return authHeader;
  }
  
  return null;
};

/**
 * Validate JWT token structure and format
 * @param {string} token - JWT token to validate
 * @returns {boolean} Whether token has valid format
 */
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Each part should be base64 encoded (basic check)
  try {
    parts.forEach(part => {
      if (!part || part.length === 0) {
        throw new Error('Empty token part');
      }
      // Validate base64 format
      Buffer.from(part, 'base64');
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if user account is in valid state for authentication
 * @param {Object} user - User object from database
 * @returns {Object} Validation result
 */
const validateUserAccount = (user) => {
  if (!user) {
    return { valid: false, reason: 'user_not_found' };
  }
  
  // Check if account is locked
  if (user.isLocked) {
    return { 
      valid: false, 
      reason: 'account_locked',
      lockUntil: user.lockUntil
    };
  }
  
  // Check account status
  if (user.status === 'suspended') {
    return { valid: false, reason: 'account_suspended' };
  }
  
  if (user.status === 'banned') {
    return { valid: false, reason: 'account_banned' };
  }
  
  if (user.status === 'inactive') {
    return { valid: false, reason: 'account_inactive' };
  }
  
  // Check email verification for non-admin users
  if (!user.emailVerified && !['admin', 'super_admin'].includes(user.role)) {
    return { valid: false, reason: 'email_not_verified' };
  }
  
  // Check if deletion was requested
  if (user.deletionRequested) {
    return { valid: false, reason: 'account_deletion_requested' };
  }
  
  return { valid: true };
};

/**
 * Check if token was issued before password change
 * @param {Object} decoded - Decoded JWT payload
 * @param {Object} user - User object from database
 * @returns {boolean} Whether token is still valid
 */
const isTokenStillValid = (decoded, user) => {
  if (!user.passwordChangedAt || !decoded.iat) {
    return true;
  }
  
  const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
  return decoded.iat > passwordChangedTimestamp;
};

/**
 * Main authentication middleware
 * Validates JWT tokens and sets user context
 */
export const authenticate = async (req, res, next) => {
  const startTime = Date.now();
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  
  try {
    // Check rate limiting
    const rateLimit = checkAuthRateLimit(clientIp);
    if (rateLimit.limited) {
      logger.warn('Authentication rate limit exceeded', {
        ip: clientIp,
        userAgent,
        reason: rateLimit.reason,
        lockoutRemaining: rateLimit.lockoutRemaining
      });
      
      return res.status(429).json({
        error: 'Too many authentication attempts',
        message: `Authentication temporarily blocked. Try again in ${Math.ceil(rateLimit.lockoutRemaining / 60)} minutes.`,
        retryAfter: rateLimit.lockoutRemaining
      });
    }

    // Extract token from request
    const token = extractToken(req);
    if (!token) {
      recordFailedAuth(clientIp);
      logger.warn('Missing or invalid authorization header', {
        ip: clientIp,
        userAgent,
        path: req.path,
        method: req.method
      });
      
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid authorization token'
      });
    }

    // Validate token format
    if (!isValidTokenFormat(token)) {
      recordFailedAuth(clientIp);
      logger.warn('Invalid token format', {
        ip: clientIp,
        userAgent,
        tokenLength: token.length
      });
      
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'The provided token has an invalid format'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      recordFailedAuth(clientIp);
      
      let errorMessage = 'Invalid authentication token';
      let errorType = 'invalid_token';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Authentication token has expired';
        errorType = 'token_expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Authentication token is malformed';
        errorType = 'token_malformed';
      } else if (jwtError.name === 'NotBeforeError') {
        errorMessage = 'Authentication token is not yet valid';
        errorType = 'token_not_active';
      }
      
      logger.warn('JWT verification failed', {
        ip: clientIp,
        userAgent,
        error: jwtError.name,
        message: jwtError.message,
        errorType
      });
      
      return res.status(401).json({
        error: errorType,
        message: errorMessage
      });
    }

    // Validate decoded token structure
    if (!decoded.userId || !decoded.iat) {
      recordFailedAuth(clientIp);
      logger.warn('Invalid token payload structure', {
        ip: clientIp,
        userAgent,
        payload: { hasUserId: !!decoded.userId, hasIat: !!decoded.iat }
      });
      
      return res.status(401).json({
        error: 'Invalid token payload',
        message: 'The token payload is missing required fields'
      });
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId)
      .select('+passwordChangedAt +lockUntil +loginAttempts');
    
    // Validate user account
    const userValidation = validateUserAccount(user);
    if (!userValidation.valid) {
      recordFailedAuth(clientIp);
      
      const errorMessages = {
        user_not_found: 'User account not found',
        account_locked: 'Account is temporarily locked due to failed login attempts',
        account_suspended: 'Account has been suspended',
        account_banned: 'Account has been banned',
        account_inactive: 'Account is inactive',
        email_not_verified: 'Email address must be verified before accessing this resource',
        account_deletion_requested: 'Account is scheduled for deletion'
      };
      
      logger.warn('User account validation failed', {
        ip: clientIp,
        userAgent,
        userId: decoded.userId,
        reason: userValidation.reason,
        lockUntil: userValidation.lockUntil
      });
      
      const statusCode = userValidation.reason === 'user_not_found' ? 401 : 403;
      return res.status(statusCode).json({
        error: userValidation.reason,
        message: errorMessages[userValidation.reason] || 'Account access denied'
      });
    }

    // Check if token is still valid (not issued before password change)
    if (!isTokenStillValid(decoded, user)) {
      recordFailedAuth(clientIp);
      logger.warn('Token invalidated by password change', {
        ip: clientIp,
        userAgent,
        userId: user._id,
        tokenIat: decoded.iat,
        passwordChangedAt: user.passwordChangedAt
      });
      
      return res.status(401).json({
        error: 'token_invalidated',
        message: 'Token is no longer valid. Please log in again.'
      });
    }

    // Success - set user context
    req.token = token;
    req.user = user;
    req.tokenPayload = decoded;
    
    // Log successful authentication
    const responseTime = Date.now() - startTime;
    logger.debug('Authentication successful', {
      userId: user._id,
      username: user.username,
      role: user.role,
      ip: clientIp,
      responseTime: `${responseTime}ms`,
      path: req.path,
      method: req.method
    });

    next();

  } catch (error) {
    recordFailedAuth(clientIp);
    
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack,
      ip: clientIp,
      userAgent,
      path: req.path,
      method: req.method
    });

    return res.status(500).json({
      error: 'Authentication service error',
      message: 'Unable to process authentication request'
    });
  }
};

/**
 * Optional authentication middleware
 * Sets user context if token is provided and valid, but doesn't require authentication
 */
export const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  
  if (!token) {
    return next(); // No token provided, continue without user context
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && isTokenStillValid(decoded, user)) {
      const userValidation = validateUserAccount(user);
      if (userValidation.valid) {
        req.user = user;
        req.token = token;
        req.tokenPayload = decoded;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional authentication failed', {
      error: error.message,
      ip: req.ip
    });
  }
  
  next();
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Role(s) that can access the resource
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const normalizedRoles = roles.map(role => role.toLowerCase());
  
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization check without authentication', {
        ip: req.ip,
        path: req.path,
        requiredRoles: normalizedRoles
      });
      
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    const userRole = req.user.role.toLowerCase();
    if (!normalizedRoles.includes(userRole)) {
      logger.warn('Insufficient role permissions', {
        userId: req.user._id,
        userRole: userRole,
        requiredRoles: normalizedRoles,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires ${normalizedRoles.join(' or ')} role`
      });
    }
    
    logger.debug('Role authorization successful', {
      userId: req.user._id,
      userRole: userRole,
      requiredRoles: normalizedRoles,
      path: req.path
    });
    
    next();
  };
};

/**
 * Permission-based authorization middleware
 * @param {string|Array} requiredPermissions - Permission(s) required to access the resource
 */
export const requirePermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    const hasPermission = permissions.some(permission => req.user.hasPermission(permission));
    
    if (!hasPermission) {
      logger.warn('Insufficient permissions', {
        userId: req.user._id,
        userPermissions: req.user.permissions,
        requiredPermissions: permissions,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This resource requires one of: ${permissions.join(', ')}`
      });
    }
    
    logger.debug('Permission authorization successful', {
      userId: req.user._id,
      requiredPermissions: permissions,
      path: req.path
    });
    
    next();
  };
};

// Legacy compatibility middlewares
export const isAdmin = requireRole(['admin', 'super_admin']);
export const isStaff = requireRole(['staff', 'admin', 'super_admin']);
export const isVolunteer = requireRole(['volunteer', 'foster', 'staff', 'admin', 'super_admin']);
