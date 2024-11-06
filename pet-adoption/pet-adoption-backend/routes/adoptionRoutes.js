import express from 'express';
import { getAllAdoptionRequests, updateAdoptionRequestStatus } from '../controllers/adoptionController.js';

const router = express.Router();

router.get('/adoption-requests', getAllAdoptionRequests);
router.patch('/adoption-requests/:id', updateAdoptionRequestStatus);

export default router;
