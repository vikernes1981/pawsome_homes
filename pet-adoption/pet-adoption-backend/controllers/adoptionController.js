import AdoptionRequest from '../models/AdoptionRequest.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import logger from '../services/logger.js';

/**
 * Adoption Controller
 * Comprehensive adoption request management with enhanced business logic and validation
 */

/**
 * Create a new adoption request
 * @route POST /admin/adoption-requests
 * @access Private (Authenticated users)
 */
export const createAdoptionRequest = async (req, res) => {
  const userId = req.user._id;
  const clientIp = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    const {
      petId,
      applicantName,
      applicantEmail,
      applicantPhone,
      address,
      housingType,
      hasYard,
      yardDetails,
      hasPets,
      currentPets,
      petExperience,
      reason,
      preferredMeetingTime
    } = req.body;

    // Verify pet exists and is available
    const pet = await Pet.findById(petId);
    if (!pet) {
      logger.warn('Adoption request attempted for non-existent pet', {
        petId,
        userId,
        ip: clientIp
      });
      return res.status(404).json({
        error: 'Pet not found',
        message: 'The requested pet does not exist'
      });
    }

    // Check if pet is available for adoption
    if (!pet.isAvailableForAdoption) {
      logger.warn('Adoption request attempted for unavailable pet', {
        petId,
        petStatus: pet.status,
        userId,
        ip: clientIp
      });
      return res.status(409).json({
        error: 'Pet unavailable',
        message: `This pet is currently ${pet.status} and not available for adoption`
      });
    }

    // Check for existing application from this user for this pet
    const existingRequest = await AdoptionRequest.findOne({
      user: userId,
      pet: petId,
      status: { $nin: ['rejected', 'withdrawn', 'completed'] }
    });

    if (existingRequest) {
      logger.warn('Duplicate adoption request attempted', {
        petId,
        userId,
        existingRequestId: existingRequest._id,
        existingStatus: existingRequest.status,
        ip: clientIp
      });
      return res.status(409).json({
        error: 'Duplicate application',
        message: `You already have a ${existingRequest.status} application for this pet`
      });
    }

    // Prepare adoption request data
    const adoptionRequestData = {
      user: userId,
      pet: petId,
      applicantName,
      applicantEmail,
      applicantPhone,
      address: {
        street: address.street,
        city: address.city,
        region: address.region,
        zip: address.zip,
        country: address.country || 'Germany'
      },
      housingType,
      hasYard: hasYard || false,
      hasPets: hasPets || false,
      reason,
      source: 'website'
    };

    // Add optional fields if provided
    if (yardDetails) adoptionRequestData.yardDetails = yardDetails;
    if (currentPets) adoptionRequestData.currentPets = currentPets;
    if (petExperience) adoptionRequestData.petExperience = petExperience;
    if (preferredMeetingTime) adoptionRequestData.preferredMeetingTime = new Date(preferredMeetingTime);

    // Create adoption request
    const adoptionRequest = new AdoptionRequest(adoptionRequestData);
    await adoptionRequest.save();

    // Update pet inquiry count
    await pet.addInquiry();

    // Update user statistics
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.applicationsSubmitted': 1 },
      $push: { adoptionApplications: adoptionRequest._id }
    });

    // Populate the response
    await adoptionRequest.populate(['user', 'pet']);

    logger.info('Adoption request created successfully', {
      requestId: adoptionRequest._id,
      petId,
      petName: pet.name,
      userId,
      userEmail: req.user.email,
      ip: clientIp
    });

    res.status(201).json({
      success: true,
      message: `Your adoption application for ${pet.name} has been submitted successfully. We will review your application and contact you within 2-3 business days.`,
      adoptionRequest: {
        id: adoptionRequest._id,
        status: adoptionRequest.status,
        petName: pet.name,
        petType: pet.type,
        submittedAt: adoptionRequest.createdAt,
        applicationAge: adoptionRequest.applicationAge
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'createAdoptionRequest',
      userId,
      petId: req.body?.petId,
      ip: clientIp
    });

    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please correct the following errors',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate application',
        message: 'You have already submitted an application for this pet'
      });
    }

    res.status(500).json({
      error: 'Application submission failed',
      message: 'Unable to submit your adoption application. Please try again later.'
    });
  }
};

/**
 * Get all adoption requests with filtering and pagination
 * @route GET /admin/adoption-requests
 * @access Admin
 */
export const getAllAdoptionRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      search = '',
      priority = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = {};
    
    // Add status filter
    if (status && status !== '') {
      query.status = status;
    }
    
    // Add search filter (search in applicant name and email)
    if (search && search.trim() !== '') {
      query.$or = [
        { applicantName: { $regex: search.trim(), $options: 'i' } },
        { applicantEmail: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    
    // Add priority filter
    if (priority && priority !== '') {
      query.priority = priority;
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries in parallel
    const [requests, totalCount] = await Promise.all([
      AdoptionRequest.find(query)
        .populate('user', 'username email')
        .populate('pet', 'name type breed')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      AdoptionRequest.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    logger.info('Adoption requests retrieved', {
      adminId: req.user._id,
      query,
      totalCount,
      page: pageNum,
      limit: limitNum,
      ip: req.ip
    });

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      filters: {
        status,
        search,
        priority,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'getAllAdoptionRequests',
      adminId: req.user._id,
      query: req.query,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Failed to retrieve adoption requests',
      message: 'Unable to fetch adoption requests. Please try again later.'
    });
  }
};

/**
 * Get a specific adoption request by ID
 * @route GET /admin/adoption-requests/:id
 * @access Admin
 */
export const getAdoptionRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;

    // Validate ObjectId format
    if (!requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid request ID',
        message: 'The provided adoption request ID is not valid'
      });
    }

    const adoptionRequest = await AdoptionRequest.findById(requestId)
      .populate({
        path: 'user',
        select: 'username email profile address volunteerInfo stats'
      })
      .populate({
        path: 'pet',
        select: 'name type breed age description status images adoptionRequirements'
      })
      .populate({
        path: 'reviewedBy',
        select: 'username email profile.firstName profile.lastName'
      })
      .populate({
        path: 'communicationLog.adminUser',
        select: 'username email'
      });

    if (!adoptionRequest) {
      return res.status(404).json({
        error: 'Request not found',
        message: 'The requested adoption request does not exist'
      });
    }

    logger.info('Adoption request retrieved', {
      requestId,
      adminId: req.user._id,
      ip: req.ip
    });

    res.json({
      success: true,
      data: adoptionRequest
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'getAdoptionRequestById',
      requestId: req.params.id,
      adminId: req.user._id,
      ip: req.ip
    });

    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid request ID',
        message: 'The provided adoption request ID is not valid'
      });
    }

    res.status(500).json({
      error: 'Failed to retrieve adoption request',
      message: 'Unable to fetch the adoption request details'
    });
  }
};

/**
 * Update adoption request status
 * @route PATCH /admin/adoption-requests/:id
 * @access Admin
 */
export const updateAdoptionRequestStatus = async (req, res) => {
  try {
    const requestId = req.params.id;
    const adminId = req.user._id;
    const { status, adminNotes, rejectionReason } = req.body;

    // Validate ObjectId format
    if (!requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid request ID',
        message: 'The provided adoption request ID is not valid'
      });
    }

    // Find the adoption request
    const adoptionRequest = await AdoptionRequest.findById(requestId)
      .populate('user pet');

    if (!adoptionRequest) {
      return res.status(404).json({
        error: 'Request not found',
        message: 'The requested adoption request does not exist'
      });
    }

    const oldStatus = adoptionRequest.status;

    // Validate status transition
    const validTransitions = {
      pending: ['under_review', 'approved', 'rejected'], // Allow direct approval
      under_review: ['interview_scheduled', 'approved', 'rejected'],
      interview_scheduled: ['approved', 'rejected'],
      approved: ['completed'],
      rejected: ['under_review', 'pending'], // Allow re-review
      completed: [],
      withdrawn: []
    };

    if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        message: `Cannot change status from ${oldStatus} to ${status}. Valid transitions: ${validTransitions[oldStatus]?.join(', ') || 'none'}`
      });
    }

    // Validate rejection reason if status is rejected
    if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 10)) {
      return res.status(400).json({
        error: 'Rejection reason required',
        message: 'A detailed rejection reason is required when rejecting an application (minimum 10 characters)'
      });
    }

    // Update the adoption request using the model method
    const updateData = { status, adminNotes, rejectionReason };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        adoptionRequest[key] = updateData[key];
      }
    });

    // Set reviewer information
    adoptionRequest.reviewedBy = adminId;
    adoptionRequest.reviewedAt = new Date();

    await adoptionRequest.save();

    // Add communication log entry
    const statusChangeMessage = `Status changed from ${oldStatus} to ${status}`;
    const logMessage = adminNotes ? `${statusChangeMessage}. Notes: ${adminNotes}` : statusChangeMessage;
    
    await adoptionRequest.addCommunicationLog('note_added', logMessage, adminId);

    // Handle business logic based on status change
    if (status === 'approved') {
      // Mark pet as pending adoption
      await Pet.findByIdAndUpdate(adoptionRequest.pet._id, {
        status: 'pending',
        $inc: { 'inquiries.total': 1 }
      });

      logger.info('Adoption request approved', {
        requestId,
        petId: adoptionRequest.pet._id,
        petName: adoptionRequest.pet.name,
        applicantEmail: adoptionRequest.applicantEmail,
        adminId
      });
    } else if (status === 'completed') {
      // Handle successful adoption
      const pet = adoptionRequest.pet;
      
      // Mark pet as adopted
      await pet.markAsAdopted(adoptionRequest.user._id, new Date());
      
      // Update user's adopted pets
      await adoptionRequest.user.addAdoptedPet(pet._id, new Date());

      logger.info('Adoption completed', {
        requestId,
        petId: pet._id,
        petName: pet.name,
        adopterId: adoptionRequest.user._id,
        adopterEmail: adoptionRequest.applicantEmail,
        adminId
      });
    } else if (status === 'rejected') {
      // Log rejection
      logger.info('Adoption request rejected', {
        requestId,
        petId: adoptionRequest.pet._id,
        rejectionReason,
        applicantEmail: adoptionRequest.applicantEmail,
        adminId
      });
    }

    // Populate the updated request for response
    await adoptionRequest.populate(['user', 'pet', 'reviewedBy']);

    res.json({
      success: true,
      message: `Adoption request status updated to ${status}`,
      data: {
        id: adoptionRequest._id,
        status: adoptionRequest.status,
        oldStatus,
        reviewedBy: adoptionRequest.reviewedBy,
        reviewedAt: adoptionRequest.reviewedAt,
        adminNotes: adoptionRequest.adminNotes,
        rejectionReason: adoptionRequest.rejectionReason
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'updateAdoptionRequestStatus',
      requestId: req.params.id,
      adminId: req.user._id,
      newStatus: req.body.status,
      ip: req.ip
    });

    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid request ID',
        message: 'The provided adoption request ID is not valid'
      });
    }

    res.status(500).json({
      error: 'Status update failed',
      message: 'Unable to update adoption request status. Please try again later.'
    });
  }
};

/**
 * Add communication log entry to adoption request
 * @route POST /admin/adoption-requests/:id/communication
 * @access Admin
 */
export const addCommunicationLog = async (req, res) => {
  try {
    const requestId = req.params.id;
    const adminId = req.user._id;
    const { type, message } = req.body;

    // Validate ObjectId format
    if (!requestId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid request ID',
        message: 'The provided adoption request ID is not valid'
      });
    }

    // Validate input
    if (!type || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Communication type and message are required'
      });
    }

    if (typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({
        error: 'Invalid message',
        message: 'Communication message must be at least 5 characters long'
      });
    }

    const validTypes = ['email_sent', 'phone_call', 'meeting_scheduled', 'meeting_completed', 'note_added'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid communication type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Find and update adoption request
    const adoptionRequest = await AdoptionRequest.findById(requestId);
    if (!adoptionRequest) {
      return res.status(404).json({
        error: 'Request not found',
        message: 'The requested adoption request does not exist'
      });
    }

    await adoptionRequest.addCommunicationLog(type, message.trim(), adminId);

    logger.info('Communication log added', {
      requestId,
      type,
      adminId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Communication log entry added successfully'
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'addCommunicationLog',
      requestId: req.params.id,
      adminId: req.user._id,
      ip: req.ip
    });

    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid request ID',
        message: 'The provided adoption request ID is not valid'
      });
    }

    res.status(500).json({
      error: 'Failed to add communication log',
      message: 'Unable to add communication log entry'
    });
  }
};

/**
 * Get adoption request statistics
 * @route GET /admin/adoption-requests/stats
 * @access Admin
 */
export const getAdoptionRequestStats = async (req, res) => {
  try {
    const { period = 30 } = req.query;
    
    // Validate period parameter
    const periodNum = parseInt(period, 10);
    if (isNaN(periodNum) || periodNum < 1 || periodNum > 365) {
      return res.status(400).json({
        error: 'Invalid period',
        message: 'Period must be a number between 1 and 365 days'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodNum);

    const [statusStats, timeStats, petTypeStats] = await Promise.all([
      // Status distribution
      AdoptionRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Applications over time
      AdoptionRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Pet type popularity
      AdoptionRequest.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $lookup: {
            from: 'pets',
            localField: 'pet',
            foreignField: '_id',
            as: 'petInfo'
          }
        },
        { $unwind: { path: '$petInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$petInfo.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Calculate conversion rates
    const totalApplications = statusStats.reduce((sum, stat) => sum + stat.count, 0);
    const approvedApplications = statusStats.find(stat => stat._id === 'approved')?.count || 0;
    const completedApplications = statusStats.find(stat => stat._id === 'completed')?.count || 0;
    
    const conversionRate = totalApplications > 0 ? 
      ((approvedApplications + completedApplications) / totalApplications * 100).toFixed(2) : 0;

    logger.info('Adoption request statistics retrieved', {
      adminId: req.user._id,
      period: periodNum,
      totalApplications,
      ip: req.ip
    });

    res.json({
      success: true,
      data: {
        period: periodNum,
        totalApplications,
        conversionRate: parseFloat(conversionRate),
        statusDistribution: statusStats,
        applicationsOverTime: timeStats,
        petTypePopularity: petTypeStats.filter(stat => stat._id !== null) // Remove null pet types
      }
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'getAdoptionRequestStats',
      adminId: req.user._id,
      period: req.query.period,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: 'Unable to generate adoption request statistics'
    });
  }
};

/**
 * Get adoption requests requiring follow-up
 * @route GET /admin/adoption-requests/follow-up
 * @access Admin
 */
export const getFollowUpRequests = async (req, res) => {
  try {
    const followUpRequests = await AdoptionRequest.findRequiringFollowUp()
      .populate('user', 'username email')
      .populate('pet', 'name type')
      .populate('reviewedBy', 'username email');

    logger.info('Follow-up requests retrieved', {
      adminId: req.user._id,
      count: followUpRequests.length,
      ip: req.ip
    });

    res.json({
      success: true,
      data: followUpRequests,
      count: followUpRequests.length
    });

  } catch (error) {
    logger.errorLog(error, {
      operation: 'getFollowUpRequests',
      adminId: req.user._id,
      ip: req.ip
    });

    res.status(500).json({
      error: 'Failed to retrieve follow-up requests',
      message: 'Unable to fetch requests requiring follow-up'
    });
  }
};