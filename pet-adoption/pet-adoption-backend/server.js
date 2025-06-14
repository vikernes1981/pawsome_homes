import logger from './services/logger.js';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import petRoutes from './routes/petRoutes.js';
import adoptionRoutes from './routes/adoptionRoutes.js';
import postRequestRoutes from './routes/postRequestRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import { authenticate, isAdmin } from './middleware/authenticate.js';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
const allowedOrigins = [
  'http://localhost:5173', // for local dev
  'https://pawsome-homes.onrender.com', // your deployed backend
  'https://pawsome-homes.vercel.app' // your deployed frontend
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true  // Enable sending cookies or authentication headers with requests
}));
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => logger.error('MongoDB connection error:', err.message));

// Routes
app.use('/api/pets', petRoutes);
app.use('/admin', authenticate, isAdmin, adoptionRoutes);
app.use('/admin', authenticate, isAdmin, authRoutes);
app.use('/api', authRoutes);
app.use('/api/adoption-requests', postRequestRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/api/forgot-password', authRoutes);
app.use('/contact', contactRoutes);

// Start server
app.listen(process.env.PORT || 5000, () => {
  logger.info("🚀 app running on port", process.env.PORT || 5000)
});