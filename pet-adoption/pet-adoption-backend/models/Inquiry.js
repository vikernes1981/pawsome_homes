// backend/models/Inquiry.js

/*const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet', // This needs to reference an existing Pet model
        required: true,
    },
}, {
    timestamps: true,
});

const Inquiry = mongoose.model('Inquiry', InquirySchema);

module.exports = Inquiry;