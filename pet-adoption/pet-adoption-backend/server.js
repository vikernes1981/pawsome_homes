import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';

import petRoutes from './routes/petRoutes.js';
import adoptionRoutes from './routes/adoptionRoutes.js';
import postRequestRoutes from './routes/postRequestRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';


dotenv.config();
const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors({
  origin: ['https://pawsome-homes.vercel.app', 'http://localhost:5173'],  // Add both Vercel and local origins
  credentials: true
}));

// Then define routes here
app.get('/api/pets', (req, res) => {
  // Your route logic
});


// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/pets', petRoutes);
app.use('/admin', adoptionRoutes);
app.use('/admin', authRoutes);
app.use('/api', authRoutes);
app.use('/api/adoption-requests', postRequestRoutes);
app.use('/chatbot', chatbotRoutes);
app.use('/api/forgot-password', authRoutes);

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 app running on port", process.env.PORT || 5000);
});
