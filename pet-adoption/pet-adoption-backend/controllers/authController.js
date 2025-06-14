import logger from '../services/logger.js';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

// LOGIN
export const loginUser = async (req, res) => {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();
  logger.info('Login attempt:', { email });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.info('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    logger.info('User found:', user);

    const isMatch = await bcrypt.compare(password, user.password);
    logger.info('Password comparison result:', isMatch);

    if (!isMatch) {
      logger.info('Password mismatch for user:', email);
      logger.info('Raw request body on login:', req.body);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    logger.info('Token generated:', token);

    res.json({ token });
  } catch (error) {
    logger.error('Server error during login:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// REGISTER
export const registerUser = async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();
  logger.info('Registration attempt:', { username, email });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.info('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    logger.info('Hashed password:', hashedPassword);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    logger.info('User registered:', user);
    logger.info('Raw request body on register:', req.body);


    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    logger.info('Token generated:', token);
    res.status(201).json({ token });
  } catch (error) {
    logger.error('Server error during registration:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// USER MGMT
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('favorites adoptedPets');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('favorites adoptedPets');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = new User({ username: username.trim(), email: email.trim(), password: hashedPassword, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.username = username?.trim() || user.username;
    user.email = email?.trim() || user.email;
    if (password) user.password = await bcrypt.hash(password.trim(), 10);
    user.role = role || user.role;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUserPassword = async (req, res) => {
  const email = req.body.email?.trim();
  const newPassword = req.body.newPassword?.trim();

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
