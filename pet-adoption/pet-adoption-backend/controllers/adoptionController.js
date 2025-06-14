import AdoptionRequest from '../models/AdoptionRequest.js';

export const getAllAdoptionRequests = async (req, res) => {
  try {
    const requests = await AdoptionRequest.find().populate('user pet');
    res.json(requests);
  } catch (error) {
    logger.error("Error retrieving adoption requests:", error.message);
    res.status(500).json({ message: 'Error retrieving adoption requests', error: error.message });
  }
};

export const updateAdoptionRequestStatus = async (req, res) => {
  try {
    const updatedRequest = await AdoptionRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Adoption request not found' });
    }
    res.json(updatedRequest);
  } catch (error) {
    logger.error("Error updating adoption request status:", error.message);
    res.status(500).json({ message: 'Error updating adoption request status', error: error.message });
  }
};

export const createAdoptionRequest = async (req, res) => {
  try {
    const { pet, firstName, lastName, email, phone, address, message, when } = req.body;
    const user = req.user._id;

    const request = new AdoptionRequest({
      user,
      pet,
      firstName,
      lastName,
      email,
      phone,
      address,
      message,
      when
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    logger.error('Adoption request creation failed:', error.message);
    res.status(500).json({ message: 'Error creating adoption request', error: error.message });

  }
};
