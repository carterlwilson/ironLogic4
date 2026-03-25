import { Router } from 'express';
import { validateInviteToken, acceptInvite } from '../controllers/invite.js';

const router = Router();

/**
 * @route   GET /api/auth/validate-invite-token
 * @desc    Validate a client invite token
 * @access  Public
 */
router.get('/validate-invite-token', validateInviteToken);

/**
 * @route   POST /api/auth/accept-invite
 * @desc    Accept a client invite and create account
 * @access  Public
 */
router.post('/accept-invite', acceptInvite);

export default router;
