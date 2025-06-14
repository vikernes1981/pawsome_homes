import express from 'express';
import { getAllAdoptionRequests, updateAdoptionRequestStatus, createAdoptionRequest } from '../controllers/adoptionController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.post('/adoption-requests', authenticate, createAdoptionRequest);
router.get('/adoption-requests', getAllAdoptionRequests);
router.patch('/adoption-requests/:id', updateAdoptionRequestStatus);

export default router;