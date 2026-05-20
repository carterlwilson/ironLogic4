import { Router } from 'express';
import { loginUser, refreshAccessToken } from '../controllers/auth.js';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', loginUser);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshAccessToken);

export default router;