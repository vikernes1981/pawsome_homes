import ContactMessage from '../models/ContactMessage.js';
import User from '../models/User.js';
import { validationResult, body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import logger from '../services/logger.js';
import mongoose from 'mongoose';

/**
 * Enterprise-grade Contact Controller
 * Handles customer communication with security, validation, and analytics
 */
class ContactController {

  /**
   * Rate limiting for contact messages to prevent spam
   */
  static contactRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 contact messages per windowMs
    message: {
      success: false,
      message: 'Too many contact messages sent. Please try again later.',
      retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for admin users
      return req.user?.role && ['admin', 'super_admin'].includes(req.user.role);
    }
  });

  /**
   * Input validation rules for contact messages
   */
  static validateContactMessage = [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s\-\.\']+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, dots, and apostrophes')
      .escape(),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('Valid email address is required')
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Email address is too long'),
    
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters')
      .escape(),
    
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subject must be less than 200 characters')
      .escape(),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Invalid phone number format'),
    
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    
    body('category')
      .optional()
      .isIn(['general', 'adoption', 'support', 'complaint', 'feedback', 'partnership'])
      .withMessage('Category must be one of: general, adoption, support, complaint, feedback, partnership')
  ];

  /**
   * Advanced spam detection
   */
  static detectSpam(messageData) {
    const spamIndicators = {
      score: 0,
      reasons: []
    };

    const { name, email, message, subject } = messageData;
    const fullText = `${name} ${email} ${message} ${subject || ''}`.toLowerCase();

    // Check for spam keywords
    const spamKeywords = [
      'viagra', 'casino', 'lottery', 'winner', 'congratulations',
      'free money', 'guaranteed', 'click here', 'limited time',
      'act now', 'urgent', 'prize', 'investment opportunity'
    ];

    spamKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) {
        spamIndicators.score += 10;
        spamIndicators.reasons.push(`Contains spam keyword: ${keyword}`);
      }
    });

    // Check for excessive links
    const linkCount = (message.match(/https?:\/\//g) || []).length;
    if (linkCount > 3) {
      spamIndicators.score += 15;
      spamIndicators.reasons.push(`Too many links: ${linkCount}`);
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(message)) {
      spamIndicators.score += 5;
      spamIndicators.reasons.push('Contains repeated characters');
    }

    // Check for all caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.7 && message.length > 50) {
      spamIndicators.score += 10;
      spamIndicators.reasons.push('Excessive capital letters');
    }

    // Check message length vs content quality
    if (message.length < 20 && linkCount > 0) {
      spamIndicators.score += 15;
      spamIndicators.reasons.push('Short message with links');
    }

    return spamIndicators;
  }

  /**
   * Get user context for better support
   */
  static async getUserContext(email, userId) {
    try {
      let userContext = {
        isRegistered: false,
        adoptionHistory: [],
        previousMessages: 0,
        userRole: 'visitor'
      };

      // Find user by email or ID
      let user = null;
      if (userId) {
        user = await User.findById(userId).lean();
      } else if (email) {
        user = await User.findOne({ email }).lean();
      }

      if (user) {
        userContext.isRegistered = true;
        userContext.userRole = user.role || 'user';
        userContext.registrationDate = user.createdAt;
      }

      // Get previous contact messages count
      userContext.previousMessages = await ContactMessage.countDocuments({
        email: email
      });

      return userContext;
    } catch (error) {
      logger.error('Error getting user context:', error);
      return { isRegistered: false, previousMessages: 0, userRole: 'visitor' };
    }
  }

  /**
   * Auto-categorize messages based on content
   */
  static categorizeMessage(message, subject = '') {
    const text = `${message} ${subject}`.toLowerCase();
    
    const categories = {
      adoption: ['adopt', 'pet', 'animal', 'application', 'meet', 'visit'],
      support: ['help', 'problem', 'issue', 'bug', 'error', 'technical'],
      complaint: ['complaint', 'dissatisfied', 'unhappy', 'poor', 'bad'],
      feedback: ['feedback', 'suggestion', 'improve', 'feature', 'idea'],
      partnership: ['partner', 'collaboration', 'business', 'sponsor']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Send contact message with comprehensive validation and processing
   * POST /api/contact/message
   */
  static async sendContactMessage(req, res) {
    const startTime = Date.now();
    
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Contact message validation failed', {
          errors: errors.array(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, email, message, subject, phone, priority, category } = req.body;
      const userId = req.user?.id;

      // Spam detection
      const spamCheck = this.detectSpam({ name, email, message, subject });
      const isSpam = spamCheck.score >= 25;

      if (isSpam) {
        logger.warn('Spam contact message detected', {
          email,
          spamScore: spamCheck.score,
          reasons: spamCheck.reasons,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(429).json({
          success: false,
          message: 'Message flagged as spam. Please contact support if this is an error.',
          flaggedReasons: spamCheck.reasons
        });
      }

      // Get user context
      const userContext = await this.getUserContext(email, userId);

      // Auto-categorize if not provided
      const finalCategory = category || this.categorizeMessage(message, subject);
      const finalPriority = priority || (userContext.userRole === 'admin' ? 'high' : 'medium');

      // Create contact message
      const contactData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        message: message.trim(),
        subject: subject?.trim() || `${finalCategory.charAt(0).toUpperCase() + finalCategory.slice(1)} Inquiry`,
        phone: phone?.replace(/[\s\-\(\)\.]/g, '') || null,
        priority: finalPriority,
        category: finalCategory,
        userId: userId || null,
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userContext,
          spamScore: spamCheck.score,
          autoCategori      },
        status: 'new'
      };

      const contactMessage = new ContactMessage(contactData);
      await contactMessage.save();

      // Log successful submission
      const responseTime = Date.now() - startTime;
      logger.info('Contact message submitted successfully', {
        messageId: contactMessage._id,
        email,
        category: finalCategory,
        priority: finalPriority,
        userId,
        isRegisteredUser: userContext.isRegistered,
        responseTime,
        spamScore: spamCheck.score
      });

      // Prepare response based on category and priority
      let responseMessage = 'Thank you for contacting us! We have received your message.';
      let estimatedResponse = '24-48 hours';

      switch (finalCategory) {
        case 'adoption':
          responseMessage = 'Thank you for your interest in adoption! Our team will review your inquiry and respond soon.';
          estimatedResponse = '12-24 hours';
          break;
        case 'support':
          responseMessage = 'We have received your support request and will assist you as soon as possible.';
          estimatedResponse = '4-12 hours';
          break;
        case 'complaint':
          responseMessage = 'We take your concerns seriously and will investigate this matter promptly.';
          estimatedResponse = '2-8 hours';
          break;
        case 'urgent':
          responseMessage = 'Your urgent message has been flagged for immediate attention.';
          estimatedResponse = '1-4 hours';
          break;
      }

      res.status(201).json({
        success: true,
        message: responseMessage,
        data: {
          messageId: contactMessage._id,
          category: finalCategory,
          priority: finalPriority,
          estimatedResponseTime: estimatedResponse,
          ticketNumber: `CONTACT-${contactMessage._id.toString().slice(-8).toUpperCase()}`
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.error('Error submitting contact message:', {
        error: error.message,
        stack: error.stack,
        email: req.body?.email,
        userId: req.user?.id,
        responseTime,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        message: 'Failed to submit your message. Please try again or contact support directly.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all contact messages with filtering and pagination (Admin only)
   * GET /api/contact/messages
   */
  static async getAllContactMessages(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        category,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = req.query;

      // Build filter object
      const filter = {};
      
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;

      // Date range filtering
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Text search
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      // Pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Sorting
      const sortOptions = {};
      const validSortFields = ['createdAt', 'priority', 'status', 'category', 'name'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const messages = await ContactMessage.find(filter)
        .populate('userId', 'username email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean();

      const totalMessages = await ContactMessage.countDocuments(filter);
      const totalPages = Math.ceil(totalMessages / limitNum);

      // Get statistics
      const stats = await ContactMessage.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            statusBreakdown: {
              $push: '$status'
            },
            categoryBreakdown: {
              $push: '$category'
            },
            priorityBreakdown: {
              $push: '$priority'
            },
            avgResponseTime: {
              $avg: '$responseTime'
            }
          }
        }
      ]);

      logger.info('Contact messages retrieved', {
        adminId: req.user.id,
        totalCount: totalMessages,
        filters: filter,
        page: pageNum
      });

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalMessages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
            limit: limitNum
          },
          statistics: stats[0] || {}
        }
      });

    } catch (error) {
      logger.error('Error retrieving contact messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve contact messages'
      });
    }
  }

  /**
   * Update contact message status (Admin only)
   * PATCH /api/contact/messages/:id
   */
  static async updateContactMessageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes, assignedTo } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid message ID format'
        });
      }

      const validStatuses = ['new', 'in_progress', 'resolved', 'closed', 'spam'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      const updateData = {
        status,
        lastUpdated: new Date(),
        lastUpdatedBy: req.user.id
      };

      if (adminNotes) updateData.adminNotes = adminNotes;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = req.user.id;
      }

      const message = await ContactMessage.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('userId', 'username email');

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Contact message not found'
        });
      }

      logger.info('Contact message status updated', {
        messageId: id,
        oldStatus: message.status,
        newStatus: status,
        adminId: req.user.id,
        adminNotes: !!adminNotes
      });

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: message
      });

    } catch (error) {
      logger.error('Error updating contact message status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update message status'
      });
    }
  }

  /**
   * Get contact message statistics (Admin only)
   * GET /api/contact/stats
   */
  static async getContactStats(req, res) {
    try {
      const { period = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const stats = await ContactMessage.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            byStatus: {
              $push: '$status'
            },
            byCategory: {
              $push: '$category'
            },
            byPriority: {
              $push: '$priority'
            },
            avgSpamScore: { $avg: '$metadata.spamScore' },
            responseTimeAvg: { $avg: '$responseTime' }
          }
        }
      ]);

      // Get daily message counts
      const dailyStats = await ContactMessage.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || {},
          dailyBreakdown: dailyStats,
          period: parseInt(period)
        }
      });

    } catch (error) {
      logger.error('Error retrieving contact statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics'
      });
    }
  }
}

// Export the class and individual methods
export default ContactController;

export const sendContactMessage = ContactController.sendContactMessage;
export const getAllContactMessages = ContactController.getAllContactMessages;
export const updateContactMessageStatus = ContactController.updateContactMessageStatus;
export const getContactStats = ContactController.getContactStats;
export const contactRateLimit = ContactController.contactRateLimit;
export const validateContactMessage = ContactController.validateContactMessage;