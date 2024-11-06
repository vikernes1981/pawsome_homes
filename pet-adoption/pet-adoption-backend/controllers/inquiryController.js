/*const Inquiry = require('../models/Inquiry');

// @desc    Create a new inquiry
// @route   POST /api/pets/:id/inquiry
// @access  Public
const createInquiry = async (req, res) => {
    const { name, email, message } = req.body;
    const petId = req.params.id;

    try {
        const inquiry = new Inquiry({
            name,
            email,
            message,
            petId
        });

        const createdInquiry = await inquiry.save();
        res.status(201).json({
            msg: "Inquiry submitted successfully",
            inquiry: createdInquiry
        });
    } catch (error) {
        console.error('Error saving inquiry:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Public
const getAllInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find();
        res.status(200).json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Ensure both functions are exported
module.exports = { createInquiry, getAllInquiries };