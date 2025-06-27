import mongoose from 'mongoose';
import validator from 'validator';

/**
 * ContactMessage Model
 * Handles contact form submissions with comprehensive validation and security features
 */

const contactMessageSchema = new mongoose.Schema({
  // Contact Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name must be less than 100 characters'],
    validate: {
      validator: function(name) {
        // Allow letters, spaces, hyphens, apostrophes, and periods for international names
        return /^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(name);
      },
      message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
    }
  },

  email: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    maxlength: [254, 'Email must be less than 254 characters'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    },
    index: true // Index for email lookups and analytics
  },

  // Message Content
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject must be less than 200 characters'],
    validate: {
      validator: function(subject) {
        // If provided, subject should not be empty or just whitespace
        return !subject || subject.trim().length > 0;
      },
      message: 'Subject cannot be empty if provided'
    }
  },

  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [5000, 'Message must be less than 5000 characters'],
    validate: {
      validator: function(message) {
        // Check for meaningful content (not just repeated characters)
        const trimmed = message.trim();
        const uniqueChars = new Set(trimmed.toLowerCase()).size;
        return uniqueChars >= 5; // Must have at least 5 unique characters
      },
      message: 'Message must contain meaningful content'
    }
  },

  // Contact Method Preferences
  phone: {
    type: String,
    trim: true,
    sparse: true, // Allow multiple documents without phone
    validate: {
      validator: function(phone) {
        if (!phone) return true; // Phone is optional
        const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
        return /^[\+]?[1-9][\d]{9,14}$/.test(cleanPhone);
      },
      message: 'Please provide a valid phone number if you choose to include one'
    }
  },

  preferredContactMethod: {
    type: String,
    enum: {
      values: ['email', 'phone', 'either'],
      message: 'Preferred contact method must be email, phone, or either'
    },
    default: 'email',
    lowercase: true
  },

  // Message Classification
  category: {
    type: String,
    enum: {
      values: [
        'general_inquiry',
        'adoption_question',
        'pet_care_advice', 
        'volunteering',
        'donation',
        'complaint',
        'compliment',
        'technical_issue',
        'partnership',
        'media_inquiry',
        'other'
      ],
      message: 'Please select a valid category'
    },
    default: 'general_inquiry',
    lowercase: true,
    index: true // Index for categorization and analytics
  },

  priority: {
    type: String,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Priority must be low, normal, high, or urgent'
    },
    default: 'normal',
    lowercase: true
  },

  // Source Tracking
  source: {
    type: String,
    enum: {
      values: ['website_form', 'mobile_app', 'email', 'phone', 'social_media', 'referral', 'other'],
      message: 'Source must be a valid option'
    },
    default: 'website_form',
    lowercase: true
  },

  referrerUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'Referrer URL must be less than 500 characters'],
    validate: {
      validator: function(url) {
        if (!url) return true; // Optional field
        return validator.isURL(url, { 
          protocols: ['http', 'https'],
          require_protocol: true 
        });
      },
      message: 'Please provide a valid URL'
    }
  },

  userAgent: {
    type: String,
    trim: true,
    maxlength: [500, 'User agent must be less than 500 characters']
  },

  ipAddress: {
    type: String,
    validate: {
      validator: function(ip) {
        if (!ip) return true; // Optional field
        return validator.isIP(ip);
      },
      message: 'Please provide a valid IP address'
    }
  },

  // Response Management
  status: {
    type: String,
    enum: {
      values: ['new', 'read', 'in_progress', 'replied', 'resolved', 'closed', 'spam'],
      message: 'Status must be a valid option'
    },
    default: 'new',
    lowercase: true,
    index: true // Index for status-based queries
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(userId) {
        // If assigned, must be a valid ObjectId
        return !userId || mongoose.Types.ObjectId.isValid(userId);
      },
      message: 'Assigned user must be a valid user ID'
    }
  },

  // Response Tracking
  responseRequired: {
    type: Boolean,
    default: true
  },

  responseDeadline: {
    type: Date,
    validate: {
      validator: function(deadline) {
        // Deadline should be in the future if set
        return !deadline || deadline > new Date();
      },
      message: 'Response deadline must be in the future'
    }
  },

  // Admin Notes and Actions
  adminNotes: [{
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Admin note must be less than 1000 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    noteType: {
      type: String,
      enum: ['general', 'follow_up', 'escalation', 'resolution'],
      default: 'general'
    }
  }],

  // Response History
  responses: [{
    method: {
      type: String,
      enum: ['email', 'phone', 'in_person', 'chat'],
      required: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    responseContent: {
      type: String,
      trim: true,
      maxlength: [2000, 'Response content must be less than 2000 characters']
    },
    successful: {
      type: Boolean,
      default: true
    }
  }],

  // Spam Detection
  spamScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  spamFlags: [{
    type: String,
    enum: [
      'suspicious_email',
      'repeated_content',
      'excessive_links',
      'suspicious_patterns',
      'blacklisted_ip',
      'rapid_submissions',
      'profanity_detected'
    ]
  }],

  // Follow-up Management
  followUpRequired: {
    type: Boolean,
    default: false
  },

  followUpDate: {
    type: Date,
    validate: {
      validator: function(date) {
        // Follow-up date should be in the future if follow-up is required
        if (this.followUpRequired && (!date || date <= new Date())) {
          return false;
        }
        return true;
      },
      message: 'Follow-up date must be in the future when follow-up is required'
    }
  },

  // Satisfaction Tracking
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: function(rating) {
        return !rating || Number.isInteger(rating);
      },
      message: 'Satisfaction rating must be a whole number between 1 and 5'
    }
  },

  satisfactionFeedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Satisfaction feedback must be less than 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and analytics
contactMessageSchema.index({ email: 1, createdAt: -1 }); // Email-based lookups
contactMessageSchema.index({ status: 1, createdAt: -1 }); // Status-based admin views
contactMessageSchema.index({ category: 1, priority: -1 }); // Category and priority filtering
contactMessageSchema.index({ assignedTo: 1, status: 1 }); // Assigned tasks view
contactMessageSchema.index({ followUpDate: 1 }, { sparse: true }); // Follow-up queries
contactMessageSchema.index({ createdAt: -1 }); // Chronological sorting
contactMessageSchema.index({ spamScore: -1 }); // Spam detection queries
contactMessageSchema.index({ responseDeadline: 1 }, { sparse: true }); // Deadline tracking

// Virtual for response time calculation
contactMessageSchema.virtual('responseTime').get(function() {
  if (this.responses && this.responses.length > 0) {
    const firstResponse = this.responses[0];
    const responseTime = firstResponse.respondedAt - this.createdAt;
    return Math.round(responseTime / (1000 * 60 * 60)); // Hours
  }
  return null;
});

// Virtual for overdue status
contactMessageSchema.virtual('isOverdue').get(function() {
  if (!this.responseDeadline) return false;
  return new Date() > this.responseDeadline && this.status !== 'resolved' && this.status !== 'closed';
});

// Virtual for urgency score (combines priority and age)
contactMessageSchema.virtual('urgencyScore').get(function() {
  const priorityWeights = { low: 1, normal: 2, high: 3, urgent: 4 };
  const priorityScore = priorityWeights[this.priority] || 2;
  
  const ageInHours = (new Date() - this.createdAt) / (1000 * 60 * 60);
  const ageScore = Math.min(ageInHours / 24, 3); // Max 3 points for age
  
  return priorityScore + ageScore;
});

// Pre-save middleware for validation and data processing
contactMessageSchema.pre('save', function(next) {
  // Normalize phone number if provided
  if (this.phone) {
    this.phone = this.phone.replace(/[\s\-\(\)\.]/g, '');
  }

  // Auto-set priority based on category
  if (this.isNew) {
    const highPriorityCategories = ['complaint', 'technical_issue', 'urgent'];
    if (highPriorityCategories.includes(this.category)) {
      this.priority = 'high';
    }
  }

  // Auto-set response deadline based on priority
  if (this.isNew && !this.responseDeadline) {
    const deadlineHours = {
      urgent: 2,
      high: 24,
      normal: 72,
      low: 168 // 1 week
    };
    
    const hours = deadlineHours[this.priority] || 72;
    this.responseDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  // Simple spam detection
  if (this.isNew) {
    let spamScore = 0;
    const messageText = (this.message + ' ' + (this.subject || '')).toLowerCase();
    
    // Check for spam patterns
    if (/https?:\/\//.test(messageText)) spamScore += 20; // Contains URLs
    if (/\b(viagra|cialis|loan|casino|poker|bitcoin)\b/.test(messageText)) spamScore += 40; // Spam keywords
    if (/(.)\1{10,}/.test(messageText)) spamScore += 30; // Repeated characters
    if (this.message.length > 3000) spamScore += 15; // Very long message
    
    this.spamScore = Math.min(spamScore, 100);
    
    // Auto-mark as spam if score is high
    if (spamScore >= 60) {
      this.status = 'spam';
    }
  }

  next();
});

// Static methods for common queries
contactMessageSchema.statics.findByStatus = function(status, options = {}) {
  const query = this.find({ status });
  
  if (options.populate) {
    query.populate('assignedTo responses.respondedBy');
  }
  
  return query.sort({ createdAt: -1 });
};

contactMessageSchema.statics.findUnresolved = function() {
  return this.find({
    status: { $in: ['new', 'read', 'in_progress'] }
  }).sort({ urgencyScore: -1, createdAt: 1 });
};

contactMessageSchema.statics.findOverdue = function() {
  return this.find({
    responseDeadline: { $lt: new Date() },
    status: { $nin: ['resolved', 'closed', 'spam'] }
  }).populate('assignedTo');
};

contactMessageSchema.statics.findRequiringFollowUp = function() {
  return this.find({
    followUpRequired: true,
    followUpDate: { $lte: new Date() }
  }).populate('assignedTo');
};

contactMessageSchema.statics.getAnalytics = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance methods
contactMessageSchema.methods.addAdminNote = function(note, userId, noteType = 'general') {
  this.adminNotes.push({
    note,
    addedBy: userId,
    noteType,
    addedAt: new Date()
  });
  return this.save();
};

contactMessageSchema.methods.addResponse = function(method, userId, content = '', successful = true) {
  this.responses.push({
    method,
    respondedBy: userId,
    responseContent: content,
    successful,
    respondedAt: new Date()
  });
  
  // Update status if this is the first response
  if (this.responses.length === 1) {
    this.status = 'replied';
  }
  
  return this.save();
};

contactMessageSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  if (this.status === 'new') {
    this.status = 'read';
  }
  return this.save();
};

contactMessageSchema.methods.markResolved = function(userId, satisfactionRating = null) {
  this.status = 'resolved';
  this.followUpRequired = false;
  
  if (satisfactionRating) {
    this.satisfactionRating = satisfactionRating;
  }
  
  this.addAdminNote('Marked as resolved', userId, 'resolution');
  return this.save();
};

export default mongoose.model('ContactMessage', contactMessageSchema);
