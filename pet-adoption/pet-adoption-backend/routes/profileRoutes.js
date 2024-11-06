import express from 'express';
import User from '../models/User.js';
import { authenticateUser } from '../middleware/authenticate.js';

const router = express.Router();

router.put('/profile', authenticateUser, async (req, res) => {
  const { bio, profilePicture, contactInfo } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio, profilePicture, contactInfo },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
