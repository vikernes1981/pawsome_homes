import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';

/**
 * User Model
 * Comprehensive user management with security, validation, and profile features
 */

const userSchema = new mongoose.Schema({
  // Authentication Information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username must be less than 30 characters'],
    validate: {
      validator: function(username) {
        // Allow letters, numbers, underscores, and hyphens
        return /^[a-zA-Z0-9_-]+$/.test(username);
      },
      message: 'Username can only contain letters, numbers, underscores, and hyphens'
    },
    index: true
  },

  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [254, 'Email must be less than 254 characters'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    },
    index: true
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    maxlength: [128, 'Password must be less than 128 characters'],
    validate: {
      validator: function(password) {
        // Require at least one lowercase, uppercase, number, and special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
      },
      message: 'Password must contain at least one lowercase letter, uppercase letter, number, and special character'
    },
    select: false // Don't include password in queries by default
  },

  // Profile Information
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name must be less than 50 characters'],
      validate: {
        validator: function(name) {
          return !name || /^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(name);
        },
        message: 'First name can only contain letters, spaces, hyphens, and apostrophes'
      }
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name must be less than 50 characters'],
      validate: {
        validator: function(name) {
          return !name || /^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(name);
        },
        message: 'Last name can only contain letters, spaces, hyphens, and apostrophes'
      }
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(date) {
          if (!date) return true;
          const now = new Date();
          const age = (now - date) / (1000 * 60 * 60 * 24 * 365.25);
          return age >= 13 && age <= 120; // Must be 13-120 years old
        },
        message: 'Date of birth must indicate an age between 13 and 120 years'
      }
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone) {
          if (!phone) return true;
          const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
          return /^[\+]?[1-9][\d]{9,14}$/.test(cleanPhone);
        },
        message: 'Please provide a valid phone number'
      }
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must be less than 500 characters']
    },
    avatar: {
      url: {
        type: String,
        validate: {
          validator: function(url) {
            return !url || validator.isURL(url) || url.startsWith('/uploads/') || url.startsWith('data:image/');
          },
          message: 'Avatar must be a valid URL or file path'
        }
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  },

  // Address Information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address must be less than 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City must be less than 100 characters'],
      validate: {
        validator: function(city) {
          return !city || /^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(city);
        },
        message: 'City name can only contain letters, spaces, hyphens, and apostrophes'
      }
    },
    region: {
      type: String,
      trim: true,
      maxlength: [100, 'Region must be less than 100 characters']
    },
    zip: {
      type: String,
      trim: true,
      maxlength: [20, 'ZIP/Postal code must be less than 20 characters'],
      validate: {
        validator: function(zip) {
          return !zip || /^[a-zA-Z0-9\s\-]+$/.test(zip);
        },
        message: 'ZIP/Postal code can only contain letters, numbers, spaces, and hyphens'
      }
    },
    country: {
      type: String,
      trim: true,
      default: 'Germany',
      maxlength: [100, 'Country name must be less than 100 characters']
    }
  },

  // Role and Permissions
  role: {
    type: String,
    enum: {
      values: ['user', 'volunteer', 'foster', 'staff', 'admin', 'super_admin'],
      message: 'Role must be user, volunteer, foster, staff, admin, or super_admin'
    },
    default: 'user',
    lowercase: true,
    index: true
  },

  permissions: [{
    type: String,
    enum: [
      'view_pets', 'create_adoption_request', 'view_own_requests',
      'moderate_content', 'manage_pets', 'manage_adoption_requests',
      'manage_users', 'view_analytics', 'system_admin'
    ]
  }],

  // Account Status
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended', 'banned', 'pending_verification'],
      message: 'Status must be active, inactive, suspended, banned, or pending_verification'
    },
    default: 'pending_verification',
    lowercase: true,
    index: true
  },

  // Email Verification
  emailVerified: {
    type: Boolean,
    default: false,
    index: true
  },

  emailVerificationToken: {
    type: String,
    select: false
  },

  emailVerificationExpires: {
    type: Date,
    select: false
  },

  // Password Reset
  passwordResetToken: {
    type: String,
    select: false
  },

  passwordResetExpires: {
    type: Date,
    select: false
  },

  passwordChangedAt: {
    type: Date,
    default: Date.now,
    select: false
  },

  // Security and Login Tracking
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  lockUntil: {
    type: Date,
    select: false
  },

  lastLogin: {
    type: Date,
    select: false
  },

  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    successful: {
      type: Boolean,
      default: true
    },
    location: {
      country: String,
      city: String
    }
  }],

  // Two-Factor Authentication
  twoFactorSecret: {
    type: String,
    select: false
  },

  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],

  // Pet-Related Information
  favorites: [{
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  adoptedPets: [{
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true
    },
    adoptionDate: {
      type: Date,
      required: true
    },
    returnDate: Date,
    returnReason: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  fosterPets: [{
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    notes: String
  }],

  // Adoption Application History
  adoptionApplications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionRequest'
  }],

  // Volunteer Information
  volunteerInfo: {
    isVolunteer: {
      type: Boolean,
      default: false
    },
    volunteerType: {
      type: String,
      enum: ['general', 'dog_walker', 'cat_socializer', 'events', 'transport', 'admin', 'other']
    },
    availability: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String,
      endTime: String
    }],
    skills: [String],
    backgroundCheckDate: Date,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },

  // Communication Preferences
  notifications: {
    email: {
      newsletter: {
        type: Boolean,
        default: true
      },
      adoptionUpdates: {
        type: Boolean,
        default: true
      },
      volunteerOpportunities: {
        type: Boolean,
        default: false
      },
      eventAnnouncements: {
        type: Boolean,
        default: true
      },
      systemNotifications: {
        type: Boolean,
        default: true
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      adoptionUpdates: {
        type: Boolean,
        default: false
      },
      emergencyOnly: {
        type: Boolean,
        default: true
      }
    }
  },

  // Privacy and Terms
  termsAcceptedAt: {
    type: Date,
    required: [true, 'Terms of service must be accepted']
  },

  privacyPolicyAcceptedAt: {
    type: Date,
    required: [true, 'Privacy policy must be accepted']
  },

  marketingConsent: {
    type: Boolean,
    default: false
  },

  // Analytics and Engagement
  stats: {
    profileViews: {
      type: Number,
      default: 0
    },
    petsViewed: {
      type: Number,
      default: 0
    },
    applicationsSubmitted: {
      type: Number,
      default: 0
    },
    successfulAdoptions: {
      type: Number,
      default: 0
    },
    volunteerHours: {
      type: Number,
      default: 0
    }
  },

  // Internal Notes (Admin Only)
  internalNotes: [{
    note: {
      type: String,
      required: true,
      maxlength: [1000, 'Internal note must be less than 1000 characters']
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
    category: {
      type: String,
      enum: ['general', 'adoption', 'volunteer', 'behavior', 'warning'],
      default: 'general'
    }
  }],

  // Account Deletion
  deletionRequested: {
    type: Boolean,
    default: false
  },

  deletionRequestedAt: Date,

  deletionScheduledFor: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.twoFactorSecret;
      delete ret.backupCodes;
      delete ret.loginHistory;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance and security
userSchema.index({ role: 1, status: 1 });
userSchema.index({ emailVerified: 1, status: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ 'volunteerInfo.isVolunteer': 1 });
userSchema.index({ deletionScheduledFor: 1 }, { sparse: true });
userSchema.index({ lockUntil: 1 }, { sparse: true });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || this.username;
});

userSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const now = new Date();
  const age = Math.floor((now - this.profile.dateOfBirth) / (1000 * 60 * 60 * 24 * 365.25));
  return age;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('activeFavorites').get(function() {
  return Array.isArray(this.favorites)
    ? this.favorites.filter(fav => fav.pet && fav.pet.status !== 'adopted')
    : [];
});

userSchema.virtual('activeAdoptions').get(function() {
  return Array.isArray(this.adoptedPets)
    ? this.adoptedPets.filter(adoption => adoption.isActive && !adoption.returnDate)
    : [];
});


userSchema.virtual('activeFosters').get(function() {
  return Array.isArray(this.fosterPets)
    ? this.fosterPets.filter(foster => foster.isActive && !foster.endDate)
    : [];
});


// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      this.passwordChangedAt = new Date();
    } catch (error) {
      return next(error);
    }
  }

  // Normalize phone number
  if (this.profile.phone) {
    this.profile.phone = this.profile.phone.replace(/[\s\-\(\)\.]/g, '');
  }

  // Set default permissions based on role
  if (this.isModified('role') || this.isNew) {
    this.permissions = this.getDefaultPermissions();
  }

  // Auto-verify admin accounts
  if (this.isNew && ['admin', 'super_admin'].includes(this.role)) {
    this.emailVerified = true;
    this.status = 'active';
  }

  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getDefaultPermissions = function() {
  const rolePermissions = {
    user: ['view_pets', 'create_adoption_request', 'view_own_requests'],
    volunteer: ['view_pets', 'create_adoption_request', 'view_own_requests', 'moderate_content'],
    foster: ['view_pets', 'create_adoption_request', 'view_own_requests', 'moderate_content'],
    staff: ['view_pets', 'create_adoption_request', 'view_own_requests', 'moderate_content', 'manage_pets', 'manage_adoption_requests'],
    admin: ['view_pets', 'create_adoption_request', 'view_own_requests', 'moderate_content', 'manage_pets', 'manage_adoption_requests', 'manage_users', 'view_analytics'],
    super_admin: ['view_pets', 'create_adoption_request', 'view_own_requests', 'moderate_content', 'manage_pets', 'manage_adoption_requests', 'manage_users', 'view_analytics', 'system_admin']
  };
  return rolePermissions[this.role] || rolePermissions.user;
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return token;
};

userSchema.methods.recordLogin = function(ipAddress, userAgent, successful = true) {
  this.lastLogin = new Date();
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    successful
  });

  // Keep only last 10 login records
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }

  if (successful) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
  }

  return this.save();
};

userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

userSchema.methods.addToFavorites = function(petId) {
  const exists = this.favorites.some(fav => fav.pet.toString() === petId.toString());
  if (!exists) {
    this.favorites.push({ pet: petId, addedAt: new Date() });
    return this.save();
  }
  return Promise.resolve(this);
};

userSchema.methods.removeFromFavorites = function(petId) {
  this.favorites = this.favorites.filter(fav => fav.pet.toString() !== petId.toString());
  return this.save();
};

userSchema.methods.addAdoptedPet = function(petId, adoptionDate = new Date()) {
  this.adoptedPets.push({
    pet: petId,
    adoptionDate,
    isActive: true
  });
  this.stats.successfulAdoptions += 1;
  return this.save();
};

userSchema.methods.addFosterPet = function(petId, startDate = new Date()) {
  this.fosterPets.push({
    pet: petId,
    startDate,
    isActive: true
  });
  return this.save();
};

userSchema.methods.addInternalNote = function(note, addedBy, category = 'general') {
  this.internalNotes.push({
    note,
    addedBy,
    category,
    addedAt: new Date()
  });
  return this.save();
};

userSchema.methods.requestDeletion = function() {
  this.deletionRequested = true;
  this.deletionRequestedAt = new Date();
  this.deletionScheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  this.status = 'inactive';
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
  return this.find({ 
    status: 'active', 
    emailVerified: true,
    deletionRequested: false 
  });
};

userSchema.statics.findVolunteers = function() {
  return this.find({ 
    'volunteerInfo.isVolunteer': true,
    status: 'active'
  });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ 
    role: role.toLowerCase(),
    status: 'active'
  });
};

userSchema.statics.getAnalytics = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        verified: { $sum: { $cond: ['$emailVerified', 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
      }
    }
  ]);
};

export default mongoose.model('User', userSchema);
