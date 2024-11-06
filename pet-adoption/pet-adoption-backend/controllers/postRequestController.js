import AdoptionRequest from '../models/AdoptionRequest.js';

export const createRequest = async (req, res) => {
  try {
    const newRequest = new AdoptionRequest({
      user: req.body.user,
      pet: req.body.pet,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        region: req.body.address.region,
        zip: req.body.address.zip,
      },
      message: req.body.message,
      when: req.body.when,
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
