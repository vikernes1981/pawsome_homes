import mongoose from 'mongoose';
import validator from 'validator';

/**
 * AdoptionRequest Model
 * Handles pet adoption applications with comprehensive validation and audit trail
 */

const adoptionRequestSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },

  // Pet reference
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: [true, 'Pet reference is required'],
    index: true
  },

  // Applicant Information
  applicantName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name must be less than 100 characters'],
    validate: {
      validator: function(name) {
        // Allow letters, spaces, hyphens, and apostrophes (international names)
        return /^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(name);
      },
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },

  // Contact Information
  applicantEmail: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    maxlength: [254, 'Email must be less than 254 characters'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    },
    index: true
  },

  applicantPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(phone) {
        // Remove common phone formatting characters
        const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
        // Validate international phone numbers (10-15 digits)
        return /^[\+]?[1-9][\d]{9,14}$/.test(cleanPhone);
      },
      message: 'Please provide a valid phone number (10-15 digits)'
    }
  },

  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      minlength: [5, 'Street address must be at least 5 characters'],
      maxlength: [200, 'Street address must be less than 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [2, 'City must be at least 2 characters'],
      maxlength: [100, 'City must be less than 100 characters'],
      validate: {
        validator: function(city) {
          return /^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(city);
        },
        message: 'City name can only contain letters, spaces, hyphens, and apostrophes'
      }
    },
    region: {
      type: String,
      required: [true, 'State/Province/Region is required'],
      trim: true,
      minlength: [2, 'Region must be at least 2 characters'],
      maxlength: [100, 'Region must be less than 100 characters']
    },
    zip: {
      type: String,
      required: [true, 'ZIP/Postal code is required'],
      trim: true,
      minlength: [3, 'ZIP/Postal code must be at least 3 characters'],
      maxlength: [20, 'ZIP/Postal code must be less than 20 characters'],
      validate: {
        validator: function(zip) {
          // Flexible postal code validation for international addresses
          return /^[a-zA-Z0-9\s\-]+$/.test(zip);
        },
        message: 'ZIP/Postal code can only contain letters, numbers, spaces, and hyphens'
      }
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'United States',
      maxlength: [100, 'Country name must be less than 100 characters']
    }
  },

  // Housing Information
  housingType: {
    type: String,
    required: [true, 'Housing type is required'],
    enum: {
      values: ['house', 'apartment', 'condo', 'townhouse', 'mobile_home', 'other'],
      message: 'Housing type must be one of: house, apartment, condo, townhouse, mobile_home, other'
    },
    lowercase: true
  },

  hasYard: {
    type: Boolean,
    default: false
  },

  yardDetails: {
    type: String,
    trim: true,
    maxlength: [500, 'Yard details must be less than 500 characters'],
    validate: {
      validator: function(details) {
        // Require yard details if hasYard is true
        if (this.hasYard && (!details || details.trim().length < 10)) {
          return false;
        }
        return true;
      },
      message: 'Yard details are required when you have a yard (minimum 10 characters)'
    }
  },

  // Pet Experience
  hasPets: {
    type: Boolean,
    default: false
  },

  currentPets: {
    type: String,
    trim: true,
    maxlength: [1000, 'Current pets description must be less than 1000 characters'],
    validate: {
      validator: function(pets) {
        // Require current pets details if hasPets is true
        if (this.hasPets && (!pets || pets.trim().length < 10)) {
          return false;
        }
        return true;
      },
      message: 'Current pets details are required when you have pets (minimum 10 characters)'
    }
  },

  petExperience: {
    type: String,
    trim: true,
    maxlength: [1000, 'Pet experience description must be less than 1000 characters']
  },

  // Application Details
  reason: {
    type: String,
    required: [true, 'Reason for adoption is required'],
    trim: true,
    minlength: [20, 'Reason must be at least 20 characters'],
    maxlength: [2000, 'Reason must be less than 2000 characters']
  },

  preferredMeetingTime: {
    type: Date,
    validate: {
      validator: function(date) {
        // Meeting time should be in the future
        return !date || date > new Date();
      },
      message: 'Preferred meeting time must be in the future'
    }
  },

  // Application Status
  status: {
    type: String,
    enum: {
      values: ['pending', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'completed', 'withdrawn'],
      message: 'Status must be one of: pending, under_review, interview_scheduled, approved, rejected, completed, withdrawn'
    },
    default: 'pending',
    lowercase: true,
    index: true
  },

  // Admin Fields
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Admin notes must be less than 2000 characters']
  },

  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [1000, 'Rejection reason must be less than 1000 characters'],
    validate: {
      validator: function(reason) {
        // Require rejection reason if status is rejected
        if (this.status === 'rejected' && (!reason || reason.trim().length < 10)) {
          return false;
        }
        return true;
      },
      message: 'Rejection reason is required when application is rejected (minimum 10 characters)'
    }
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(userId) {
        // Require reviewedBy when status changes from pending
        if (this.status !== 'pending' && !userId) {
          return false;
        }
        return true;
      },
      message: 'Reviewer is required when status changes from pending'
    }
  },

  reviewedAt: {
    type: Date,
    validate: {
      validator: function(date) {
        // Set reviewedAt when status changes from pending
        if (this.status !== 'pending' && !date) {
          return false;
        }
        return true;
      },
      message: 'Review date is required when status changes from pending'
    }
  },

  // Communication Log
  communicationLog: [{
    type: {
      type: String,
      enum: ['email_sent', 'phone_call', 'meeting_scheduled', 'meeting_completed', 'note_added'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [1000, 'Communication message must be less than 1000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],

  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    lowercase: true
  },

  // Application Source
  source: {
    type: String,
    enum: ['website', 'phone', 'email', 'walk_in', 'referral'],
    default: 'website',
    lowercase: true
  },

  // Follow-up Information
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
adoptionRequestSchema.index({ user: 1, pet: 1 }, { unique: true }); // Prevent duplicate applications
adoptionRequestSchema.index({ status: 1, createdAt: -1 }); // For admin dashboard
// adoptionRequestSchema.index({ applicantEmail: 1 }); // REMOVED - Already exists in database
adoptionRequestSchema.index({ followUpDate: 1 }, { sparse: true }); // For follow-up queries
adoptionRequestSchema.index({ createdAt: -1 }); // For chronological sorting

// Virtual for full applicant name (backward compatibility)
adoptionRequestSchema.virtual('fullName').get(function() {
  return this.applicantName;
});

// Virtual for formatted address
adoptionRequestSchema.virtual('formattedAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.region} ${addr.zip}, ${addr.country}`;
});

// Virtual for application age in days
adoptionRequestSchema.virtual('applicationAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware for data validation and normalization
adoptionRequestSchema.pre('save', function(next) {
  // Normalize phone number
  if (this.applicantPhone) {
    this.applicantPhone = this.applicantPhone.replace(/[\s\-\(\)\.]/g, '');
  }

  // Set reviewedAt when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }

  // Auto-set follow-up for certain statuses
  if (this.isModified('status') && ['under_review', 'interview_scheduled'].includes(this.status)) {
    if (!this.followUpRequired) {
      this.followUpRequired = true;
      if (!this.followUpDate) {
        // Set follow-up for 3 days from now
        this.followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      }
    }
  }

  next();
});

// Static methods for common queries
adoptionRequestSchema.statics.findByStatus = function(status, options = {}) {
  const query = this.find({ status });
  
  if (options.populate) {
    query.populate('user pet reviewedBy');
  }
  
  if (options.sort) {
    query.sort(options.sort);
  } else {
    query.sort({ createdAt: -1 });
  }

  return query;
};

adoptionRequestSchema.statics.findPendingApplications = function() {
  return this.find({ status: 'pending' })
    .populate('user pet')
    .sort({ createdAt: 1 }); // Oldest first for FIFO processing
};

adoptionRequestSchema.statics.findRequiringFollowUp = function() {
  return this.find({
    followUpRequired: true,
    followUpDate: { $lte: new Date() }
  }).populate('user pet reviewedBy');
};

// Instance methods
adoptionRequestSchema.methods.addCommunicationLog = function(type, message, adminUser) {
  this.communicationLog.push({
    type,
    message,
    adminUser,
    timestamp: new Date()
  });
  return this.save();
};

adoptionRequestSchema.methods.updateStatus = function(newStatus, adminUser, notes = '') {
  this.status = newStatus;
  this.reviewedBy = adminUser;
  this.reviewedAt = new Date();
  
  if (notes) {
    this.adminNotes = this.adminNotes ? `${this.adminNotes}\n\n${notes}` : notes;
  }

  // Add communication log entry
  this.communicationLog.push({
    type: 'note_added',
    message: `Status changed to ${newStatus}${notes ? `: ${notes}` : ''}`,
    adminUser,
    timestamp: new Date()
  });

  return this.save();
};

export default mongoose.model('AdoptionRequest', adoptionRequestSchema);
