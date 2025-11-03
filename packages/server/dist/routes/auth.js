import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.js';
const router = Router();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerUser);
/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', loginUser);
export default router;
//# sourceMappingURL=auth.js.map