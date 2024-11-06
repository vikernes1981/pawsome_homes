import express from 'express';
import { createRequest } from '../controllers/postRequestController.js';

const router = express.Router();

// Define the route to handle POST requests
router.post('/', createRequest);

export default router;
