import AdoptionRequest from '../models/AdoptionRequest.js';

export const getAllAdoptionRequests = async (req, res) => {
  try {
    const requests = await AdoptionRequest.find().populate('user pet');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving adoption requests', error });
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
    res.status(500).json({ message: 'Error updating adoption request status', error });
  }
};
