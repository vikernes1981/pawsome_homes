import mongoose from 'mongoose';
import validator from 'validator';

/**
 * Pet Model
 * Comprehensive pet management with advanced validation, business logic, and tracking
 */

const petSchema = new mongoose.Schema({
  // Basic Pet Information
  name: {
    type: String,
    required: [true, 'Pet name is required'],
    trim: true,
    minlength: [1, 'Pet name must be at least 1 character long'],
    maxlength: [50, 'Pet name must be less than 50 characters'],
    validate: {
      validator: function(name) {
        // Allow letters, numbers, spaces, hyphens, apostrophes for pet names
        return /^[a-zA-ZÀ-ÿ0-9\s\-'\.]+$/.test(name);
      },
      message: 'Pet name can only contain letters, numbers, spaces, hyphens, and apostrophes'
    },
    index: true // For name-based searches
  },

  // Age and Life Stage
  age: {
    type: Number,
    required: [true, 'Pet age is required'],
    min: [0, 'Pet age cannot be negative'],
    max: [50, 'Pet age seems unrealistic (max 50 years)'],
    validate: {
      validator: function(age) {
        // Age should be a reasonable number
        return Number.isInteger(age) || (age % 0.5 === 0); // Allow half years
      },
      message: 'Pet age must be a whole number or half year (e.g., 2.5)'
    }
  },

  ageUnit: {
    type: String,
    enum: {
      values: ['years', 'months', 'weeks'],
      message: 'Age unit must be years, months, or weeks'
    },
    default: 'years',
    lowercase: true
  },

  // Breed and Type Information
  breed: {
    type: String,
    required: [true, 'Pet breed is required'],
    trim: true,
    minlength: [2, 'Breed must be at least 2 characters long'],
    maxlength: [100, 'Breed must be less than 100 characters'],
    validate: {
      validator: function(breed) {
        return /^[a-zA-ZÀ-ÿ\s\-\/]+$/.test(breed);
      },
      message: 'Breed can only contain letters, spaces, hyphens, and forward slashes'
    },
    index: true // For breed-based filtering
  },

  type: {
    type: String,
    enum: {
      values: ['dog', 'cat', 'bird', 'rabbit', 'guinea_pig', 'hamster', 'fish', 'turtle', 'reptile', 'other'],
      message: 'Pet type must be one of the supported animal types'
    },
    required: [true, 'Pet type is required'],
    lowercase: true,
    index: true // For type-based filtering
  },

  // Physical Characteristics
  size: {
    type: String,
    enum: {
      values: ['extra_small', 'small', 'medium', 'large', 'extra_large'],
      message: 'Size must be extra_small, small, medium, large, or extra_large'
    },
    lowercase: true,
    index: true // For size-based filtering
  },

  weight: {
    type: Number,
    min: [0.1, 'Weight must be at least 0.1 kg'],
    max: [200, 'Weight seems unrealistic (max 200 kg)'],
    validate: {
      validator: function(weight) {
        return !weight || weight > 0;
      },
      message: 'Weight must be a positive number'
    }
  },

  color: {
    type: String,
    trim: true,
    maxlength: [100, 'Color description must be less than 100 characters']
  },

  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'unknown'],
      message: 'Gender must be male, female, or unknown'
    },
    lowercase: true
  },

  // Description and Personality
  description: {
    type: String,
    required: [true, 'Pet description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters long'],
    maxlength: [2000, 'Description must be less than 2000 characters']
  },

  personality: {
    type: [String],
    validate: {
      validator: function(traits) {
        const validTraits = [
          'friendly', 'energetic', 'calm', 'playful', 'gentle', 'protective',
          'independent', 'social', 'quiet', 'vocal', 'curious', 'loyal',
          'intelligent', 'trainable', 'affectionate', 'shy', 'confident'
        ];
        return traits.every(trait => validTraits.includes(trait.toLowerCase()));
      },
      message: 'Personality traits must be from the predefined list'
    },
    default: []
  },

  // Health Information
  healthStatus: {
    type: String,
    enum: {
      values: ['excellent', 'good', 'fair', 'needs_attention', 'special_needs'],
      message: 'Health status must be excellent, good, fair, needs_attention, or special_needs'
    },
    default: 'good',
    lowercase: true
  },

  isSpayedNeutered: {
    type: Boolean,
    default: false
  },

  vaccinations: {
    current: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date <= new Date();
        },
        message: 'Vaccination date cannot be in the future'
      }
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'Vaccination details must be less than 500 characters']
    }
  },

  medicalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Medical notes must be less than 1000 characters']
  },

  specialNeeds: {
    type: String,
    trim: true,
    maxlength: [1000, 'Special needs description must be less than 1000 characters']
  },

  // Media and Documentation
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        if (!url) return true; // Allow empty
        return url.startsWith('http') || 
              url.startsWith('data:image/') || 
              url.startsWith('/uploads/');
      },
      message: 'Image must be a valid URL or data URI'
    }
  },

  images: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(url) {
          return validator.isURL(url) || url.startsWith('/uploads/') || url.startsWith('data:image/');
        },
        message: 'Image must be a valid URL or file path'
      }
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [200, 'Image alt text must be less than 200 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  videos: [{
    url: {
      type: String,
      validate: {
        validator: function(url) {
          return validator.isURL(url) || url.startsWith('/uploads/');
        },
        message: 'Video must be a valid URL or file path'
      }
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Video title must be less than 100 characters']
    },
    duration: Number, // in seconds
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  documents: [{
    type: {
      type: String,
      enum: ['medical_record', 'vaccination_record', 'behavioral_assessment', 'intake_form', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Document name must be less than 100 characters']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Adoption Status and History
  status: {
    type: String,
    enum: {
      values: ['available', 'pending', 'on_hold', 'adopted', 'fostered', 'returned', 'unavailable'],
      message: 'Status must be available, pending, on_hold, adopted, fostered, returned, or unavailable'
    },
    default: 'available',
    lowercase: true,
    index: true // For status-based filtering
  },

  adoptionHistory: [{
    adopter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adoptionDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date > this.adoptionDate;
        },
        message: 'Return date must be after adoption date'
      }
    },
    returnReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Return reason must be less than 500 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Adoption notes must be less than 1000 characters']
    }
  }],

  currentAdopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(adopter) {
        // Current adopter should only be set if status is adopted or fostered
        if (adopter && !['adopted', 'fostered'].includes(this.status)) {
          return false;
        }
        return true;
      },
      message: 'Current adopter can only be set when status is adopted or fostered'
    }
  },

  adoptionDate: {
    type: Date,
    validate: {
      validator: function(date) {
        // Adoption date should be set when status is adopted
        if (this.status === 'adopted' && !date) {
          return false;
        }
        if (date && date > new Date()) {
          return false;
        }
        return true;
      },
      message: 'Adoption date is required for adopted pets and cannot be in the future'
    }
  },

  // Behavioral Information
  goodWith: {
    children: {
      type: Boolean,
      default: null // null means unknown
    },
    dogs: {
      type: Boolean,
      default: null
    },
    cats: {
      type: Boolean,
      default: null
    },
    smallAnimals: {
      type: Boolean,
      default: null
    }
  },

  // Care Requirements
  exerciseNeeds: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very_high'],
    lowercase: true
  },

  groomingNeeds: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    lowercase: true
  },

  trainingLevel: {
    type: String,
    enum: ['untrained', 'basic', 'intermediate', 'advanced'],
    default: 'untrained',
    lowercase: true
  },

  houseTrained: {
    type: Boolean,
    default: false
  },

  // Intake Information
  intakeDate: {
    type: Date,
    required: [true, 'Intake date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Intake date cannot be in the future'
    },
    index: true // For chronological queries
  },

  intakeSource: {
    type: String,
    enum: {
      values: ['stray', 'surrender', 'transfer', 'born_in_care', 'confiscation', 'other'],
      message: 'Intake source must be a valid option'
    },
    required: [true, 'Intake source is required'],
    lowercase: true
  },

  intakeReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Intake reason must be less than 500 characters']
  },

  previousOwner: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Previous owner name must be less than 100 characters']
    },
    contact: {
      type: String,
      trim: true,
      maxlength: [200, 'Previous owner contact must be less than 200 characters']
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Surrender reason must be less than 500 characters']
    }
  },

  // Location and Housing
  currentLocation: {
    type: String,
    enum: ['shelter', 'foster', 'medical', 'quarantine', 'adopted'],
    default: 'shelter',
    lowercase: true
  },

  kennelNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Kennel number must be less than 20 characters'],
    sparse: true // Allow multiple pets without kennel numbers
  },

  fosterFamily: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Adoption Requirements and Preferences
  adoptionRequirements: {
    experienceRequired: {
      type: Boolean,
      default: false
    },
    fencedYardRequired: {
      type: Boolean,
      default: false
    },
    homeVisitRequired: {
      type: Boolean,
      default: true
    },
    childrenAgeMinimum: {
      type: Number,
      min: 0,
      max: 18
    },
    noOtherPets: {
      type: Boolean,
      default: false
    }
  },

  adoptionFee: {
    amount: {
      type: Number,
      min: [0, 'Adoption fee cannot be negative'],
      max: [10000, 'Adoption fee seems unrealistic']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      maxlength: 3
    },
    includesServices: {
      type: [String],
      default: []
    }
  },

  // SEO and External Links
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true // For URL-based lookups
  },

  externalLinks: [{
    platform: {
      type: String,
      enum: ['petfinder', 'adopt_a_pet', 'facebook', 'instagram', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: validator.isURL,
        message: 'External link must be a valid URL'
      }
    },
    active: {
      type: Boolean,
      default: true
    }
  }],

  // Analytics and Metrics
  views: {
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    lastViewed: Date,
    uniqueViewers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      viewedAt: {
        type: Date,
        default: Date.now
      },
      ipAddress: String
    }]
  },

  inquiries: {
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    lastInquiry: Date
  },

  // Internal Management
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    lowercase: true
  },

  internalNotes: [{
    note: {
      type: String,
      required: true,
      trim: true,
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
      enum: ['general', 'medical', 'behavioral', 'adoption', 'foster'],
      default: 'general'
    }
  }],

  tags: [{
    type: String,
    lowercase: true,
    trim: true,
    maxlength: [30, 'Tag must be less than 30 characters']
  }],

  // Featured and Promotion
  isFeatured: {
    type: Boolean,
    default: false,
    index: true // For featured pet queries
  },

  featuredUntil: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Featured until date must be in the future'
    }
  },

  urgentAdoption: {
    type: Boolean,
    default: false,
    index: true // For urgent adoption queries
  },

  urgentReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Urgent reason must be less than 200 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and common queries
petSchema.index({ type: 1, status: 1, createdAt: -1 }); // Type and status filtering
petSchema.index({ status: 1, isFeatured: -1, createdAt: -1 }); // Featured pets
petSchema.index({ status: 1, urgentAdoption: -1 }); // Urgent adoptions
petSchema.index({ breed: 1, type: 1 }); // Breed and type searches
petSchema.index({ age: 1, size: 1, type: 1 }); // Age, size, type filtering
petSchema.index({ intakeDate: -1 }); // Chronological intake queries
petSchema.index({ name: 'text', description: 'text' }); // Text search
petSchema.index({ tags: 1 }); // Tag-based searches
petSchema.index({ 'views.total': -1 }); // Popular pets
petSchema.index({ currentLocation: 1, status: 1 }); // Location-based queries

// Virtual fields
petSchema.virtual('ageInMonths').get(function() {
  const multipliers = { years: 12, months: 1, weeks: 0.25 };
  return this.age * (multipliers[this.ageUnit] || 12);
});

petSchema.virtual('timeInCare').get(function() {
  const now = new Date();
  const intakeDate = this.intakeDate || this.createdAt;
  return Math.floor((now - intakeDate) / (1000 * 60 * 60 * 24)); // Days
});

petSchema.virtual('primaryImage').get(function() {
  if (!this.images || this.images.length === 0) return null;
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0];
});

petSchema.virtual('isAvailableForAdoption').get(function() {
  return ['available', 'pending'].includes(this.status);
});

petSchema.virtual('needsUrgentAttention').get(function() {
  return this.urgentAdoption || 
         this.healthStatus === 'needs_attention' || 
         this.timeInCare > 365 || // Over a year in care
         this.priority === 'urgent';
});

// Pre-save middleware
petSchema.pre('save', function(next) {
  // Generate slug from name and ID
  if (this.isNew || this.isModified('name')) {
    const baseSlug = this.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.slug = `${baseSlug}-${this._id.toString().slice(-6)}`;
  }

  // Validate current adopter relationship
  if (this.status === 'adopted' && !this.currentAdopter) {
    return next(new Error('Current adopter is required when status is adopted'));
  }

  // Auto-set adoption date if status changes to adopted
  if (this.isModified('status') && this.status === 'adopted' && !this.adoptionDate) {
    this.adoptionDate = new Date();
  }

  // Ensure only one primary image
  if (this.images && this.images.length > 1) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    } else if (primaryImages.length === 0) {
      // Set first image as primary
      this.images[0].isPrimary = true;
    }
  }

  // Update featured status if expired
  if (this.featuredUntil && this.featuredUntil <= new Date()) {
    this.isFeatured = false;
    this.featuredUntil = undefined;
  }

  next();
});

// Static methods for common queries
petSchema.statics.findAvailable = function(filters = {}) {
  return this.find({
    status: { $in: ['available', 'pending'] },
    ...filters
  }).sort({ isFeatured: -1, urgentAdoption: -1, createdAt: -1 });
};

petSchema.statics.findFeatured = function(limit = 6) {
  return this.find({
    isFeatured: true,
    status: { $in: ['available', 'pending'] }
  }).limit(limit).sort({ featuredUntil: 1 });
};

petSchema.statics.findUrgent = function() {
  return this.find({
    $or: [
      { urgentAdoption: true },
      { priority: 'urgent' },
      { healthStatus: 'needs_attention' }
    ],
    status: { $in: ['available', 'pending'] }
  }).sort({ priority: -1, urgentAdoption: -1 });
};

petSchema.statics.findByType = function(type, filters = {}) {
  return this.find({
    type: type.toLowerCase(),
    status: { $in: ['available', 'pending'] },
    ...filters
  }).sort({ isFeatured: -1, createdAt: -1 });
};

petSchema.statics.searchPets = function(query, filters = {}) {
  return this.find({
    $text: { $search: query },
    status: { $in: ['available', 'pending'] },
    ...filters
  }, {
    score: { $meta: 'textScore' }
  }).sort({ score: { $meta: 'textScore' } });
};

petSchema.statics.getAnalytics = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        adopted: { $sum: { $cond: [{ $eq: ['$status', 'adopted'] }, 1, 0] } },
        avgViews: { $avg: '$views.total' },
        avgTimeInCare: { $avg: '$timeInCare' }
      }
    }
  ]);
};

// Instance methods
petSchema.methods.addView = function(userId = null, ipAddress = null) {
  this.views.total += 1;
  this.views.lastViewed = new Date();
  
  if (userId || ipAddress) {
    this.views.uniqueViewers.push({
      user: userId,
      ipAddress,
      viewedAt: new Date()
    });
  }
  
  return this.save();
};

petSchema.methods.addInquiry = function() {
  this.inquiries.total += 1;
  this.inquiries.lastInquiry = new Date();
  return this.save();
};

petSchema.methods.addNote = function(note, userId, category = 'general') {
  this.internalNotes.push({
    note,
    addedBy: userId,
    category,
    addedAt: new Date()
  });
  return this.save();
};

petSchema.methods.markAsAdopted = function(adopterId, adoptionDate = new Date()) {
  this.status = 'adopted';
  this.currentAdopter = adopterId;
  this.adoptionDate = adoptionDate;
  
  // Add to adoption history
  this.adoptionHistory.push({
    adopter: adopterId,
    adoptionDate,
    notes: `Pet adopted on ${adoptionDate.toDateString()}`
  });
  
  return this.save();
};

petSchema.methods.markAsReturned = function(returnReason, returnDate = new Date()) {
  // Update current adoption in history
  const currentAdoption = this.adoptionHistory[this.adoptionHistory.length - 1];
  if (currentAdoption) {
    currentAdoption.returnDate = returnDate;
    currentAdoption.returnReason = returnReason;
  }
  
  this.status = 'returned';
  this.currentAdopter = null;
  this.adoptionDate = null;
  
  return this.save();
};

export default mongoose.model('Pet', petSchema);
