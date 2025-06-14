import ContactMessage from '../models/ContactMessage.js';

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const entry = new ContactMessage({ name, email, message });
    await entry.save();
    res.status(201).json({ message: 'Message received' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit message' });
  }
};
