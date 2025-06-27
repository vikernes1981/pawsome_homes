import AdoptionRequest from '../models/AdoptionRequest.js';

export const createRequest = async (req, res) => {
  try {
    const newRequest = new AdoptionRequest({
      user: req.body.user,
      pet: req.body.pet,
      applicantName: req.body.applicantName,
      applicantEmail: req.body.applicantEmail,
      applicantPhone: req.body.applicantPhone,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        region: req.body.address.region,
        zip: req.body.address.zip,
        country: req.body.address.country || 'United States'
      },
      housingType: req.body.housingType,
      hasYard: req.body.hasYard || false,
      yardDetails: req.body.yardDetails,
      hasPets: req.body.hasPets || false,
      currentPets: req.body.currentPets,
      petExperience: req.body.petExperience,
      reason: req.body.reason,
      preferredMeetingTime: req.body.preferredMeetingTime
    });
    
    console.log('Incoming request payload:', req.body);
    await newRequest.save();
    res.status(201).json({
      success: true,
      message: 'Adoption request created successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Error creating adoption request:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};