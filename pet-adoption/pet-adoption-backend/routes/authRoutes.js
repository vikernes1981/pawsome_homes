import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, registerUser, loginUser, updateUserPassword } from '../controllers/authController.js';

const router = express.Router();

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.get('/user', getUserById);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.patch('/forgot-password', updateUserPassword);


export default router;
