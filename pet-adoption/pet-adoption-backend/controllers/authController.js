import logger from '../services/logger.js';
import dotenv from 'dotenv';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';

dotenv.config();

/**
 * Authentication Controller
 * Comprehensive user authentication with security features and proper error handling
 */

/**
 * Rate limiting for sensitive operations
 */
const sensitiveOperations = new Map();
const SENSITIVE_RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxAttempts: 5 },
  register: { windowMs: 60 * 60 * 1000, maxAttempts: 3 },
  passwordReset: { windowMs: 60 * 60 * 1000, maxAttempts: 3 }
};

/**
 * Check rate limiting for sensitive operations
 * @param {string} operation - Operation type (login, register, passwordReset)
 * @param {string} identifier - IP address or email
 * @returns {Object} Rate limit status
 */
const checkSensitiveRateLimit = (operation, identifier) => {
  const key = `${operation}:${identifier}`;
  const now = Date.now();
  const limits = SENSITIVE_RATE_LIMITS[operation];
  
  // Clean up old entries
  for (const [entryKey, data] of sensitiveOperations.entries()) {
    if (now - data.firstAttempt > limits.windowMs) {
      sensitiveOperations.delete(entryKey);
    }
  }
  
  const attempts = sensitiveOperations.get(key);
  
  if (!attempts) {
    sensitiveOperations.set(key, { firstAttempt: now, count: 1 });
    return { limited: false, remaining: limits.maxAttempts - 1 };
  }
  
  if (now - attempts.firstAttempt > limits.windowMs) {
    sensitiveOperations.set(key, { firstAttempt: now, count: 1 });
    return { limited: false, remaining: limits.maxAttempts - 1 };
  }
  
  if (attempts.count >= limits.maxAttempts) {
    return { 
      limited: true, 
      retryAfter: Math.ceil((limits.windowMs - (now - attempts.firstAttempt)) / 1000)
    };
  }
  
  attempts.count++;
  return { limited: false, remaining: limits.maxAttempts - attempts.count };
};

/**
 * Validate registration input
 * @param {Object} userData - User registration data
 * @returns {Object} Validation result
 */
const validateRegistrationInput = (userData) => {
  const errors = [];
  const { username, email, password, termsAccepted, privacyAccepted } = userData;

  // Username validation
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
  } else {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      errors.push('Username must be at least 3 characters long');
    } else if (trimmedUsername.length > 30) {
      errors.push('Username must be less than 30 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push('Email address is required');
  } else {
    const trimmedEmail = email.trim().toLowerCase();
    if (!validator.isEmail(trimmedEmail)) {
      errors.push('Please provide a valid email address');
    } else if (trimmedEmail.length > 254) {
      errors.push('Email address is too long');
    }
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter, uppercase letter, number, and special character');
    }
  }

  // Terms and privacy validation
  if (!termsAccepted) {
    errors.push('You must accept the terms of service');
  }
  
  if (!privacyAccepted) {
    errors.push('You must accept the privacy policy');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Generate JWT token with enhanced security
 * @param {Object} user - User object
 * @param {string} tokenType - Type of token (access, refresh)
 * @returns {string} JWT token
 */
const generateToken = (user, tokenType = 'access') => {
  const payload = {
    userId: user._id,
    role: user.role,
    tokenType,
    iat: Math.floor(Date.now() / 1000)
  };

  const options = {
    expiresIn: tokenType === 'refresh' ? '7d' : '1h',
    issuer: 'pawsome-homes',
    audience: 'pawsome-homes-users'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Send email verification
 * @param {Object} user - User object
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (user, token) => {
  // Email service integration would go here
  logger.info('Email verification sent', {
    userId: user._id,
    email: user.email,
    tokenLength: token.length
  });
  // TODO: Integrate with email service (SendGrid, SES, etc.)
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (user, token) => {
  // Email service integration would go here
  logger.info('Password reset email sent', {
    userId: user._id,
    email: user.email,
    tokenLength: token.length
  });
  // TODO: Integrate with email service
};

/**
 * User Registration
 * @route POST /api/register
 */
export const registerUser = async (req, res) => {
  const clientIp = req.ip;
  const userAgent = req.get('User-Agent');
  
  try {
    // Rate limiting check
    const rateLimit = checkSensitiveRateLimit('register', clientIp);
    if (rateLimit.limited) {
      logger.warn('Registration rate limit exceeded', {
        ip: clientIp,
        userAgent,
        retryAfter: rateLimit.retryAfter
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`,
        retryAfter: rateLimit.retryAfter
      });
    }

    // Input validation
    const validation = validateRegistrationInput(req.body);
    if (!validation.valid) {
      logger.warn('Registration validation failed', {
        ip: clientIp,
        email: req.body.email,
        errors: validation.errors
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors',
        details: validation.errors
      });
    }

    const { username, email, password } = req.body;
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { username: trimmedUsername }
      ]
    });

    if (existingUser) {
      logger.warn('Registration attempt with existing credentials', {
        ip: clientIp,
        email: trimmedEmail,
        username: trimmedUsername,
        existingField: existingUser.email === trimmedEmail ? 'email' : 'username'
      });
      
      return res.status(409).json({
        error: 'User already exists',
        message: existingUser.email === trimmedEmail 
          ? 'An account with this email address already exists'
          : 'An account with this username already exists'
      });
    }

    // Create new user
    const userData = {
      username: trimmedUsername,
      email: trimmedEmail,
      password, // Will be hashed by pre-save middleware
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
      profile: {},
      address: {}
    };

    const user = new User(userData);
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    // Generate tokens
    const accessToken = generateToken(user, 'access');
    const refreshToken = generateToken(user, 'refresh');

    logger.info('User registered successfully', {
      userId: user._id,
      username: user.username,
      email: user.email,
      ip: clientIp,
      userAgent
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'registerUser',
      ip: clientIp,
      email: req.body?.email,
      username: req.body?.username
    });

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: 'Duplicate entry',
        message: `An account with this ${field} already exists`
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'Unable to create account. Please try again later.'
    });
  }
};

/**
 * User Login
 * @route POST /api/login
 */
export const loginUser = async (req, res) => {
  const clientIp = req.ip;
  const userAgent = req.get('User-Agent');
  
  try {
    // Rate limiting check
    const rateLimit = checkSensitiveRateLimit('login', clientIp);
    if (rateLimit.limited) {
      logger.warn('Login rate limit exceeded', {
        ip: clientIp,
        userAgent,
        retryAfter: rateLimit.retryAfter
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many login attempts. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`,
        retryAfter: rateLimit.retryAfter
      });
    }

    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', {
        ip: clientIp,
        hasEmail: !!email,
        hasPassword: !!password
      });
      
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user and include password for comparison
    const user = await User.findOne({ email: trimmedEmail })
      .select('+password +loginAttempts +lockUntil +passwordChangedAt');

    if (!user) {
      logger.warn('Login attempt with non-existent email', {
        ip: clientIp,
        email: trimmedEmail,
        userAgent
      });
      
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      logger.warn('Login attempt on locked account', {
        userId: user._id,
        email: user.email,
        ip: clientIp,
        lockUntil: user.lockUntil
      });
      
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Record failed login attempt
      await user.incLoginAttempts();
      
      logger.warn('Login attempt with invalid password', {
        userId: user._id,
        email: user.email,
        ip: clientIp,
        loginAttempts: user.loginAttempts + 1
      });
      
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      logger.warn('Login attempt on suspended account', {
        userId: user._id,
        email: user.email,
        ip: clientIp
      });
      
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    if (user.status === 'banned') {
      logger.warn('Login attempt on banned account', {
        userId: user._id,
        email: user.email,
        ip: clientIp
      });
      
      return res.status(403).json({
        error: 'Account banned',
        message: 'Your account has been banned.'
      });
    }

    // Record successful login
    await user.recordLogin(clientIp, userAgent, true);

    // Generate tokens
    const accessToken = generateToken(user, 'access');
    const refreshToken = generateToken(user, 'refresh');

    logger.info('User logged in successfully', {
      userId: user._id,
      username: user.username,
      email: user.email,
      ip: clientIp,
      userAgent
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        fullName: user.fullName
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'loginUser',
      ip: clientIp,
      email: req.body?.email
    });

    res.status(500).json({
      error: 'Login failed',
      message: 'Unable to process login request. Please try again later.'
    });
  }
};

/**
 * Request Password Reset
 * @route POST /api/forgot-password
 */
export const requestPasswordReset = async (req, res) => {
  const clientIp = req.ip;
  
  try {
    // Rate limiting check
    const rateLimit = checkSensitiveRateLimit('passwordReset', clientIp);
    if (rateLimit.limited) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many password reset requests. Please try again in ${Math.ceil(rateLimit.retryAfter / 60)} minutes.`,
        retryAfter: rateLimit.retryAfter
      });
    }

    const { email } = req.body;

    if (!email || !validator.isEmail(email.trim())) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };

    if (!user) {
      logger.warn('Password reset requested for non-existent email', {
        email: trimmedEmail,
        ip: clientIp
      });
      return res.json(successResponse);
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    logger.info('Password reset requested', {
      userId: user._id,
      email: user.email,
      ip: clientIp
    });

    res.json(successResponse);

  } catch (error) {
    logger.errorLog(error, {
      operation: 'requestPasswordReset',
      ip: clientIp,
      email: req.body?.email
    });

    res.status(500).json({
      error: 'Password reset failed',
      message: 'Unable to process password reset request. Please try again later.'
    });
  }
};

/**
 * Reset Password
 * @route POST /api/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Reset token and new password are required'
      });
    }

    // Hash the token to compare with stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      logger.warn('Invalid or expired password reset token', {
        token: token.substring(0, 10) + '...',
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Validate new password
    if (newPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      });
    }

    // Update password and clear reset token
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();

    await user.save();

    logger.info('Password reset completed', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'resetPassword',
      ip: req.ip
    });

    res.status(500).json({
      error: 'Password reset failed',
      message: 'Unable to reset password. Please try again later.'
    });
  }
};

/**
 * Verify Email
 * @route POST /api/verify-email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Verification token is required'
      });
    }

    // Hash the token to compare with stored version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'Email verification token is invalid or has expired'
      });
    }

    // Update user verification status
    user.emailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    logger.info('Email verified successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'verifyEmail',
      ip: req.ip
    });

    res.status(500).json({
      error: 'Email verification failed',
      message: 'Unable to verify email. Please try again later.'
    });
  }
};

/**
 * Refresh Token
 * @route POST /api/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type',
        message: 'Invalid refresh token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: 'Invalid user',
        message: 'User not found or inactive'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user, 'access');

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 3600
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Refresh token has expired. Please log in again.'
      });
    }

    logger.errorLog(error, {
      operation: 'refreshToken',
      ip: req.ip
    });

    res.status(401).json({
      error: 'Token refresh failed',
      message: 'Unable to refresh token. Please log in again.'
    });
  }
};

/**
 * Get Current User Profile
 * @route GET /api/user
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites.pet')
      .populate('adoptedPets.pet')
      .populate('fosterPets.pet');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        profile: user.profile,
        address: user.address,
        favorites: user.favorites,
        adoptedPets: user.activeAdoptions,
        fosterPets: user.activeFosters,
        stats: user.stats,
        notifications: user.notifications,
        volunteerInfo: user.volunteerInfo,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'getCurrentUser',
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'Unable to retrieve user information'
    });
  }
};

/**
 * Update User Profile
 * @route PATCH /api/user/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const allowedUpdates = ['profile', 'address', 'notifications'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid updates',
        message: 'No valid fields to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    logger.info('User profile updated', {
      userId: user._id,
      updatedFields: Object.keys(updates),
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        profile: user.profile,
        address: user.address,
        notifications: user.notifications
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'updateProfile',
      userId: req.user._id
    });

    res.status(500).json({
      error: 'Profile update failed',
      message: 'Unable to update profile. Please try again later.'
    });
  }
};

// Legacy compatibility - keeping for backward compatibility but adding proper error handling
export const updateUserPassword = async (req, res) => {
  // Redirect to proper password reset flow
  return res.status(400).json({
    error: 'Deprecated endpoint',
    message: 'Please use the password reset flow instead',
    redirectTo: '/api/forgot-password'
  });
};

// Admin user management functions would go here...
// (getAllUsers, getUserById, createUser, updateUser, deleteUser)
// These would have similar improvements with proper validation, logging, and error handling
