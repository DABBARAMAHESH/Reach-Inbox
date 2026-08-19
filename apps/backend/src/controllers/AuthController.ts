import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { generateToken } from '../lib/jwt';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';
import { UserRepository } from '../repositories/UserRepository';
import { SenderRepository } from '../repositories/SenderRepository';
import { MailService } from '../services/MailService';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';

export class AuthController {
  static googleAuth(req: Request, res: Response, next: NextFunction) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return AuthController.devLogin(req, res, next);
    }
    return passport.authenticate('google', {
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'],
      accessType: 'offline',
      prompt: 'consent',
      session: false
    })(req, res, next);
  }

  static googleCallback(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('google', { session: false }, async (err, user) => {
      if (err || !user) {
        logger.error({ err }, 'Google Auth Callback Error');
        return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      // Mark Google users as verified automatically
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });

      const token = generateToken({
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.redirect(`${env.FRONTEND_URL}/dashboard`);
    })(req, res, next);
  }

  /** POST /api/auth/register — email+password registration */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
      }

      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 90000).toString();

      const user = await UserRepository.registerWithPassword({
        name,
        email,
        password,
        verificationOtp: otp
      });

      // Automatically configure system Gmail SMTP sender using the registration email and password
      // (This will act as their sender once they verify)
      try {
        await SenderRepository.create({
          userId: user.id,
          displayName: name,
          email: email,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: email,
          smtpPassword: password
        });
        logger.info({ email }, 'Automatically configured Gmail SMTP sender for registering user');
      } catch (e) {
        logger.warn({ error: e }, 'Could not auto-create Gmail SMTP sender on registration');
      }

      // Send the OTP verification email
      let etherealLink = '';
      try {
        etherealLink = await MailService.sendVerificationOtp(email, otp);
      } catch (e) {
        logger.error({ error: e, email }, 'Could not send verification OTP to user');
      }

      return res.status(201).json({
        success: true,
        data: {
          message: 'Verification OTP sent to email',
          needsVerification: true,
          email,
          etherealLink // returned to easily view the OTP on local dev logs/responses
        }
      });
    } catch (error: any) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({ success: false, error: 'An account with this email already exists' });
      }
      next(error);
    }
  }

  /** POST /api/auth/verify-otp — Verify registration OTP */
  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and OTP are required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (user.verificationOtp !== otp) {
        return res.status(400).json({ success: false, error: 'Invalid verification OTP code' });
      }

      // Mark verified
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { isVerified: true, verificationOtp: null }
      });

      const token = generateToken({
        id: updatedUser.id,
        googleId: updatedUser.googleId ?? '',
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl ?? ''
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            avatarUrl: updatedUser.avatarUrl
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/auth/resend-otp — Resend verification OTP */
  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const otp = Math.floor(100000 + Math.random() * 90000).toString();
      await prisma.user.update({
        where: { email },
        data: { verificationOtp: otp }
      });

      const etherealLink = await MailService.sendVerificationOtp(email, otp);

      return res.status(200).json({
        success: true,
        data: {
          message: 'OTP Resent successfully',
          email,
          etherealLink
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/auth/login — email+password login */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const user = await UserRepository.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      // Check verification status
      if (!user.isVerified) {
        // Automatically resend OTP code if login is requested but user is not verified
        const otp = Math.floor(100000 + Math.random() * 90000).toString();
        await prisma.user.update({
          where: { id: user.id },
          data: { verificationOtp: otp }
        });
        const etherealLink = await MailService.sendVerificationOtp(user.email, otp);

        return res.status(403).json({
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          data: {
            email: user.email,
            message: 'Email not verified yet. A verification code has been sent.',
            etherealLink
          }
        });
      }

      const token = generateToken({
        id: user.id,
        googleId: user.googleId ?? '',
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? ''
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async devLogin(_req: Request, res: Response, next: NextFunction) {
    try {
      const devGoogleId = 'dev-google-id-12345';
      const devEmail = 'demo.user@reachinbox.test';
      const devName = 'Demo Engineer';
      const devAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo';

      const user = await UserRepository.upsertGoogleUser({
        googleId: devGoogleId,
        email: devEmail,
        name: devName,
        avatarUrl: devAvatar
      });

      // Mark dev user verified
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });

      const existingSenders = await SenderRepository.findByUserId(user.id);
      if (existingSenders.length === 0) {
        try {
          const etherealAcc = await MailService.createEtherealAccount();
          await SenderRepository.create({
            userId: user.id,
            displayName: `${user.name} (Ethereal Default)`,
            email: etherealAcc.etherealUser,
            etherealUser: etherealAcc.etherealUser,
            etherealPassword: etherealAcc.etherealPassword,
            smtpHost: etherealAcc.smtpHost,
            smtpPort: etherealAcc.smtpPort
          });
        } catch (e) {
          logger.warn({ error: e }, 'Could not auto-create default sender');
        }
      }

      const token = generateToken({
        id: user.id,
        googleId: user.googleId ?? '',
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? ''
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static me(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    return res.status(200).json({ success: true, data: authReq.user });
  }

  static logout(_req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  }
}
