import logger from '../services/logger.js';
import User from '../models/User.js';
import validator from 'validator';
import mongoose from 'mongoose';

/**
 * User Management Controller
 * Enterprise-grade CRUD operations for user management (NOT authentication)
 */

/**
 * Validate user input data
 * @param {Object} userData - User data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result
 */
const validateUserInput = (userData, isUpdate = false) => {
  const errors = [];
  const { username, email, password, role, profile = {}, address = {} } = userData;

  // Username validation
  if (!isUpdate || username !== undefined) {
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
  }

  // Email validation
  if (!isUpdate || email !== undefined) {
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
  }

  // Password validation (only for create or when password is provided)
  if (!isUpdate || (password && password.length > 0)) {
    if (!password && !isUpdate) {
      errors.push('Password is required');
    } else if (password) {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      } else if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter, uppercase letter, number, and special character');
      }
    }
  }

  // Role validation
  if (!isUpdate || role !== undefined) {
    const validRoles = ['user', 'volunteer', 'foster', 'staff', 'admin', 'super_admin'];
    if (!role && !isUpdate) {
      errors.push('Role is required');
    } else if (role && !validRoles.includes(role)) {
      errors.push('Invalid role selected');
    }
  }

  // Profile validation
  if (profile.firstName && profile.firstName.length > 50) {
    errors.push('First name must be less than 50 characters');
  }
  if (profile.lastName && profile.lastName.length > 50) {
    errors.push('Last name must be less than 50 characters');
  }
  if (profile.phone && !/^[\+]?[1-9][\d]{9,14}$/.test(profile.phone.replace(/[\s\-\(\)\.]/g, ''))) {
    errors.push('Please provide a valid phone number');
  }
  if (profile.bio && profile.bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  }

  // Address validation
  if (address.street && address.street.length > 200) {
    errors.push('Street address must be less than 200 characters');
  }
  if (address.city && address.city.length > 100) {
    errors.push('City must be less than 100 characters');
  }
  if (address.zip && address.zip.length > 20) {
    errors.push('ZIP/Postal code must be less than 20 characters');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Check if user has permission to perform operation
 * @param {Object} currentUser - User making the request
 * @param {string} operation - Operation being performed
 * @param {Object} targetUser - User being operated on (optional)
 * @returns {boolean} Whether user has permission
 */
const hasPermission = (currentUser, operation, targetUser = null) => {
  // Super admin can do anything
  if (currentUser.role === 'super_admin') {
    return true;
  }

  // Admin can manage all users except super_admin
  if (currentUser.role === 'admin') {
    if (targetUser && targetUser.role === 'super_admin') {
      return false;
    }
    return ['view', 'create', 'update', 'delete'].includes(operation);
  }

  // Staff can view and create regular users
  if (currentUser.role === 'staff') {
    if (targetUser && ['admin', 'super_admin'].includes(targetUser.role)) {
      return false;
    }
    return ['view', 'create'].includes(operation);
  }

  return false;
};

/**
 * Build MongoDB query from filters
 * @param {Object} filters - Filter parameters
 * @returns {Object} MongoDB query object
 */
const buildUserQuery = (filters) => {
  const query = {};
  
  if (filters.search) {
    query.$or = [
      { username: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { 'profile.firstName': { $regex: filters.search, $options: 'i' } },
      { 'profile.lastName': { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  if (filters.role) {
    query.role = filters.role;
  }
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.emailVerified !== undefined) {
    query.emailVerified = filters.emailVerified === 'true';
  }
  
  if (filters.isVolunteer !== undefined) {
    query['volunteerInfo.isVolunteer'] = filters.isVolunteer === 'true';
  }

  // Date range filters
  if (filters.createdAfter) {
    query.createdAt = { ...query.createdAt, $gte: new Date(filters.createdAfter) };
  }
  
  if (filters.createdBefore) {
    query.createdAt = { ...query.createdAt, $lte: new Date(filters.createdBefore) };
  }

  return query;
};

/**
 * Get all users with pagination and filtering
 * @route GET /api/users
 */
export const getAllUsers = async (req, res) => {
  try {
    // Check permissions - FIXED: Use correct permission name
    if (!hasPermission(req.user, 'manage_users')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to view users'
      });
    }

    // Parse and validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query from filters
    const query = buildUserQuery(req.query);

    // Build sort object
    const sort = { [sortBy]: sortOrder };

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -loginHistory -backupCodes -twoFactorSecret')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean(),
      User.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info('Users retrieved successfully', {
      requestedBy: req.user._id,
      totalCount,
      page,
      limit,
      filters: req.query,
      ip: req.ip
    });

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage
      },
      total: totalCount
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'getAllUsers',
      requestedBy: req.user._id,
      filters: req.query,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Failed to retrieve users',
      message: 'Unable to fetch users. Please try again later.'
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    const user = await User.findById(id)
      .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -loginHistory -backupCodes -twoFactorSecret')
      .populate('favorites.pet', 'name breed type image status')
      .populate('adoptedPets.pet', 'name breed type image')
      .populate('fosterPets.pet', 'name breed type image')
      .lean();

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    // Check permissions
    if (!hasPermission(req.user, 'view', user)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to view this user'
      });
    }

    logger.info('User retrieved by ID', {
      requestedBy: req.user._id,
      targetUserId: id,
      ip: req.ip
    });

    res.json({
      success: true,
      user
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'getUserById',
      requestedBy: req.user._id,
      targetUserId: req.params.id,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Failed to retrieve user',
      message: 'Unable to fetch user details. Please try again later.'
    });
  }
};

/**
 * Create new user
 * @route POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    // Check permissions
    if (!hasPermission(req.user, 'create')) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to create users'
      });
    }

    // Validate input
    const validation = validateUserInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors',
        details: validation.errors
      });
    }

    const { username, email, password, role = 'user', ...otherData } = req.body;
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Check if user can create this role
    if (['admin', 'super_admin'].includes(role) && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You cannot create users with admin privileges'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { username: trimmedUsername }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: existingUser.email === trimmedEmail 
          ? 'An account with this email address already exists'
          : 'An account with this username already exists'
      });
    }

    // Create user data
    const userData = {
      username: trimmedUsername,
      email: trimmedEmail,
      password,
      role,
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
      status: req.user.role === 'super_admin' ? 'active' : 'pending_verification',
      emailVerified: req.user.role === 'super_admin', // Auto-verify if created by super admin
      ...otherData
    };

    const user = new User(userData);
    await user.save();

    // Remove sensitive data from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info('User created successfully', {
      createdBy: req.user._id,
      newUserId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'createUser',
      requestedBy: req.user._id,
      userData: { username: req.body?.username, email: req.body?.email },
      ip: req.ip
    });

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: 'Duplicate entry',
        message: `An account with this ${field} already exists`
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors',
        details: validationErrors
      });
    }

    res.status(500).json({
      error: 'User creation failed',
      message: 'Unable to create user. Please try again later.'
    });
  }
};

/**
 * Update user
 * @route PATCH /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    // Find existing user
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    // Check permissions
    if (!hasPermission(req.user, 'update', existingUser)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to update this user'
      });
    }

    // Validate input for updates
    const validation = validateUserInput(req.body, true);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors',
        details: validation.errors
      });
    }

    const updates = { ...req.body };
    
    // Remove password if empty to avoid overwriting
    if (!updates.password || updates.password.trim() === '') {
      delete updates.password;
    }

    // Check role change permissions
    if (updates.role && updates.role !== existingUser.role) {
    // Only super_admin can create super_admin
    if (updates.role === 'super_admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Only super administrators can promote users to super admin'
        });
    }
    
    // Admin can promote to admin, but not super_admin
    if (updates.role === 'admin' && !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You cannot promote users to admin privileges'
        });
    }
    }

    // Check for username/email conflicts
    if (updates.username || updates.email) {
      const conflictQuery = {
        _id: { $ne: id },
        $or: []
      };
      
      if (updates.username) {
        conflictQuery.$or.push({ username: updates.username.trim() });
      }
      
      if (updates.email) {
        conflictQuery.$or.push({ email: updates.email.trim().toLowerCase() });
      }
      
      if (conflictQuery.$or.length > 0) {
        const conflictUser = await User.findOne(conflictQuery);
        if (conflictUser) {
          const conflictField = conflictUser.username === updates.username ? 'username' : 'email';
          return res.status(409).json({
            error: 'Conflict detected',
            message: `An account with this ${conflictField} already exists`
          });
        }
      }
    }

    // Normalize email
    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { 
        new: true, 
        runValidators: true,
        select: '-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -loginHistory -backupCodes -twoFactorSecret'
      }
    );

    logger.info('User updated successfully', {
      updatedBy: req.user._id,
      targetUserId: id,
      updatedFields: Object.keys(updates),
      roleChange: updates.role ? { from: existingUser.role, to: updates.role } : null,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'updateUser',
      requestedBy: req.user._id,
      targetUserId: req.params.id,
      updateData: req.body,
      ip: req.ip
    });

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: 'Duplicate entry',
        message: `An account with this ${field} already exists`
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors',
        details: validationErrors
      });
    }

    res.status(500).json({
      error: 'User update failed',
      message: 'Unable to update user. Please try again later.'
    });
  }
};

/**
 * Delete user (soft delete by default)
 * @route DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false, reason = '' } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'Please provide a valid user ID'
      });
    }

    // Find existing user
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    // Check permissions
    if (!hasPermission(req.user, 'delete', existingUser)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to delete this user'
      });
    }

    // Prevent self-deletion
    if (existingUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot delete your own account'
      });
    }

    // Prevent deletion of super admin by non-super admin
    if (existingUser.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You cannot delete super admin accounts'
      });
    }

    let result;
    
    if (permanent && req.user.role === 'super_admin') {
      // Hard delete (only super admin can do this)
      result = await User.findByIdAndDelete(id);
      
      logger.warn('User permanently deleted', {
        deletedBy: req.user._id,
        deletedUserId: id,
        deletedUsername: existingUser.username,
        reason: reason || 'No reason provided',
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'User permanently deleted',
        permanent: true
      });
    } else {
      // Soft delete (mark for deletion)
      const deletionDate = new Date();
      const scheduledDeletion = new Date(deletionDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      result = await User.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'inactive',
            deletionRequested: true,
            deletionRequestedAt: deletionDate,
            deletionScheduledFor: scheduledDeletion
          },
          $push: {
            internalNotes: {
              note: `Account marked for deletion. Reason: ${reason || 'No reason provided'}`,
              addedBy: req.user._id,
              category: 'general',
              addedAt: deletionDate
            }
          }
        },
        { new: true }
      );

      logger.info('User marked for deletion', {
        deletedBy: req.user._id,
        targetUserId: id,
        targetUsername: existingUser.username,
        scheduledFor: scheduledDeletion,
        reason: reason || 'No reason provided',
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'User marked for deletion and will be permanently removed in 30 days',
        permanent: false,
        scheduledDeletion
      });
    }

  } catch (error) {
    logger.errorLog(error, {
      operation: 'deleteUser',
      requestedBy: req.user._id,
      targetUserId: req.params.id,
      ip: req.ip
    });

    res.status(500).json({
      error: 'User deletion failed',
      message: 'Unable to delete user. Please try again later.'
    });
  }
};