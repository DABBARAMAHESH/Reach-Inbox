import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Google OAuth (kept for future use)
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);

// Email + password auth
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);

// Dev login (local testing only)
router.post('/dev-login', AuthController.devLogin);

// Protected routes
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
