import Pet from '../models/Pet.js';
import User from '../models/User.js';
import AdoptionRequest from '../models/AdoptionRequest.js';
import logger from '../services/logger.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

/**
 * Enterprise-grade Pet Controller
 * Enhanced version of your existing pet management system
 */

/**
 * Get all pets with advanced filtering, search, and pagination
 * Enhanced version of your original getAllPets function
 * GET /api/pets
 */
export const getAllPets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      breed,
      location,
      age,
      type,
      species,
      size,
      gender,
      status, // ✅ FIXED: Removed default value, now optional
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minAge,
      maxAge
    } = req.query;

    // Build dynamic filter object
    const filter = {};
    
    // Your original filters
    if (breed) filter.breed = { $regex: breed, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (age) filter.age = parseInt(age);
    
    // Enhanced filters
    if (type) filter.type = { $regex: type, $options: 'i' };
    if (species) filter.species = { $regex: species, $options: 'i' };
    if (size) filter.size = size;
    if (gender) filter.gender = gender;
    
    // ✅ FIXED: Only filter by status if explicitly provided
    if (status && status !== 'all') filter.status = status;

    // Age range filtering
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = parseInt(minAge);
      if (maxAge) filter.age.$lte = parseInt(maxAge);
    }

    // Text search across multiple fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination setup
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions = {};
    const validSortFields = ['createdAt', 'name', 'age', 'breed', 'type'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    // ✅ DEBUG: Log the filter being applied
    console.log('🔍 Pet filter applied:', {
      filter,
      requestedStatus: status,
      queryParams: req.query
    });

    // Execute query
    const pets = await Pet.find(filter)
      .select('-__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ✅ DEBUG: Log what we're returning
    console.log('📤 Pets returned:', {
      totalFound: pets.length,
      statuses: pets.map(pet => ({ name: pet.name, status: pet.status }))
    });

    // Get total count for pagination
    const totalPets = await Pet.countDocuments(filter);
    const totalPages = Math.ceil(totalPets / limitNum);

    logger.info('Pets retrieved successfully', {
      userId: req.user?.id,
      totalCount: totalPets,
      page: pageNum,
      filters: filter
    });

    // Enhanced response format while maintaining backward compatibility
    if (req.query.enhanced === 'true') {
      res.json({
        success: true,
        data: {
          pets,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalPets,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
            limit: limitNum
          }
        }
      });
    } else {
      // Original response format for backward compatibility
      res.json(pets);
    }

  } catch (error) {
    logger.error('Error retrieving pets:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      query: req.query
    });

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve pets'
    });
  }
};

/**
 * Create a new pet listing
 * Enhanced version of your original createPet function
 * POST /api/pets
 */

export const createPet = async (req, res) => {
  try {
    // ✅ FIXED: Added intakeSource and intakeDate to destructuring
    const { 
      name, 
      age, 
      breed, 
      type, 
      description, 
      image, 
      link, 
      location, 
      species, 
      size, 
      gender,
      intakeSource,  // ✅ Added - Required field
      intakeDate     // ✅ Added - Required field
    } = req.body;

    // ✅ FIXED: Updated validation to include new required fields
    if (!name || !age || !breed || !type || !intakeSource || !intakeDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, age, breed, type, intakeSource, and intakeDate are required fields'
      });
    }

    // ✅ FIXED: Create pet data including new fields
    const petData = {
      name: name.trim(),
      age: parseInt(age),
      breed: breed.trim(),
      type: type.trim(),
      description: description?.trim() || '',
      image: image || null,
      link: link || null,
      
      // Enhanced fields
      location: location || 'Not specified',
      species: species || type, // Use type as fallback for species
      size: size || 'medium',
      gender: gender || 'unknown',
      
      // ✅ FIXED: Added the missing required fields
      intakeSource: intakeSource.trim(),
      intakeDate: new Date(intakeDate),
      
      // System fields
      status: 'available',
      addedBy: req.user?.id,
      createdAt: new Date(),
      viewCount: 0
    };

    const pet = new Pet(petData);
    await pet.save();

    logger.info('New pet created successfully', {
      petId: pet._id,
      petName: pet.name,
      type: pet.type,
      intakeSource: pet.intakeSource,
      createdBy: req.user?.id
    });

    res.status(201).json(pet);

  } catch (error) {
    logger.error('Error creating pet:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      petData: req.body
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to create pet'
    });
  }
};

/**
 * Get a specific pet by ID
 * Enhanced version of your original getPetById function
 * GET /api/pets/:id
 */
export const getPetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid pet ID format'
      });
    }

    const pet = await Pet.findById(id);

    if (!pet) {
      logger.warn('Pet not found', {
        petId: id,
        userId: req.user?.id
      });
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Pet not found' 
      });
    }

    // Increment view count (don't wait for completion)
    Pet.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();

    // Get similar pets for recommendations
    const similarPets = await Pet.find({
      _id: { $ne: id },
      $or: [
        { breed: pet.breed },
        { type: pet.type },
        { species: pet.species }
      ],
      status: 'available'
    })
    .select('name type breed age image')
    .limit(4)
    .lean();

    logger.info('Pet details retrieved', {
      petId: id,
      userId: req.user?.id,
      petName: pet.name
    });

    // Enhanced response format while maintaining backward compatibility
    if (req.query.enhanced === 'true') {
      res.json({
        success: true,
        data: {
          pet,
          recommendations: similarPets,
          canAdopt: req.user && pet.status === 'available'
        }
      });
    } else {
      // Original response format
      res.json(pet);
    }

  } catch (error) {
    logger.error('Error retrieving pet details:', {
      error: error.message,
      petId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({ 
      error: 'Server Error',
      message: 'Server error' 
    });
  }
};

/**
 * Update a pet listing
 * Enhanced version of your original updatePet function
 * PUT /api/pets/:id
 */
export const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, breed, location, description, image, link, type, species, size, gender, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid pet ID format'
      });
    }

    // Build update object (keeping your original fields + enhancements)
    const updateData = {
      lastUpdated: new Date(),
      lastUpdatedBy: req.user?.id
    };

    // Your original fields
    if (name !== undefined) updateData.name = name.trim();
    if (age !== undefined) updateData.age = parseInt(age);
    if (breed !== undefined) updateData.breed = breed.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link;

    // Enhanced fields
    if (type !== undefined) updateData.type = type.trim();
    if (species !== undefined) updateData.species = species.trim();
    if (size !== undefined) updateData.size = size;
    if (gender !== undefined) updateData.gender = gender;
    if (status !== undefined) updateData.status = status;

    const pet = await Pet.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Pet not found' 
      });
    }

    logger.info('Pet updated successfully', {
      petId: id,
      petName: pet.name,
      updatedBy: req.user?.id,
      changesCount: Object.keys(updateData).length
    });

    res.json(pet);

  } catch (error) {
    logger.error('Error updating pet:', {
      error: error.message,
      petId: req.params.id,
      userId: req.user?.id
    });

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update pet'
    });
  }
};

/**
 * Submit an inquiry for a specific pet
 * Enhanced version of your original submitInquiry function
 * POST /api/pets/:petId/inquiry
 */
export const submitInquiry = async (req, res) => {
  try {
    const { petId } = req.params;
    const { name, email, message, phone, preferredContactMethod } = req.body;

    // Input validation
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, email, and message are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(petId)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid pet ID format'
      });
    }

    // Check if pet exists and is available
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Pet not found'
      });
    }

    if (pet.status && pet.status !== 'available') {
      return res.status(400).json({
        error: 'Pet Unavailable',
        message: `This pet is currently ${pet.status} and not available for inquiries`
      });
    }

    // Create inquiry data
    const inquiryData = {
      petId: petId,
      petName: pet.name,
      inquirerName: name.trim(),
      inquirerEmail: email.trim().toLowerCase(),
      inquirerPhone: phone?.replace(/[\s\-\(\)\.]/g, '') || null,
      message: message.trim(),
      preferredContactMethod: preferredContactMethod || 'email',
      inquiryDate: new Date(),
      status: 'new',
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null
      }
    };

    // Store inquiry in pet's inquiries array
    if (!pet.inquiries) pet.inquiries = [];
    pet.inquiries.push(inquiryData);
    
    // Update inquiry count
    pet.inquiryCount = (pet.inquiryCount || 0) + 1;
    
    await pet.save();

    logger.info('Pet inquiry submitted', {
      petId,
      petName: pet.name,
      inquirerEmail: inquiryData.inquirerEmail,
      inquirerName: inquiryData.inquirerName,
      userId: req.user?.id
    });

    // Enhanced response while maintaining your original message
    if (req.query.enhanced === 'true') {
      res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully',
        data: {
          inquiryId: pet.inquiries[pet.inquiries.length - 1]._id,
          petName: pet.name,
          estimatedResponseTime: '24-48 hours'
        }
      });
    } else {
      // Your original response format
      res.json({ msg: 'Inquiry submitted successfully' });
    }

  } catch (error) {
    logger.error('Error submitting pet inquiry:', {
      error: error.message,
      petId: req.params.petId,
      inquirerEmail: req.body?.email
    });

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to submit inquiry'
    });
  }
};