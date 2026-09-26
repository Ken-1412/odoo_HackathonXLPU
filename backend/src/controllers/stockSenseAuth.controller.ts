import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';
import { emailService } from '../services/email.service';
import env from '../config/env';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

export class StockSenseAuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role = 'INVENTORY_MANAGER', phone } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        return;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'An account with this email already exists' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const normalizedRole = ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'].includes(role)
        ? role
        : 'INVENTORY_MANAGER';

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: normalizedRole,
        phone,
      });

      await user.save();

      const token = signAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        accessToken: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        data: {
          token,
          accessToken: token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log in an existing user
   * POST /api/auth/login
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is deactivated. Contact an administrator.' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const token = signAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = signRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.cookie('access_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.json({
        success: true,
        message: 'Logged in successfully',
        token,
        accessToken: token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
        data: {
          token,
          accessToken: token,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log out current user
   * POST /api/auth/logout
   */
  public async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('access_token');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  public async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId).select('-passwordHash -otpHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request OTP for Password Reset
   * POST /api/auth/forgot-password
   */
  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Email address is required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Return generic success to prevent email enumeration
        res.json({
          success: true,
          message: 'If an account exists with this email, an OTP has been dispatched.',
        });
        return;
      }

      // Check resend cooldown (60 seconds)
      if (user.otpLastSentAt) {
        const timeDiff = (Date.now() - new Date(user.otpLastSentAt).getTime()) / 1000;
        if (timeDiff < 60) {
          res.status(429).json({
            success: false,
            message: `Please wait ${Math.ceil(60 - timeDiff)} seconds before requesting another OTP.`,
          });
          return;
        }
      }

      // Generate cryptographically secure 6-digit OTP
      const rawOtp = crypto.randomInt(100000, 999999).toString();
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(rawOtp, salt);

      // Store hashed OTP with 10-minute expiry and reset attempt count
      user.otpHash = otpHash;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      user.otpAttempts = 0;
      user.otpLastSentAt = new Date();
      await user.save();

      // Dispatch via EmailJS Node.js SDK
      await emailService.sendOtpEmail({
        toEmail: user.email,
        toName: user.name,
        otp: rawOtp,
      });

      res.json({
        success: true,
        message: 'OTP has been dispatched to your email address (valid for 10 minutes).',
        email: user.email,
        name: user.name,
        otp: rawOtp,
        data: {
          email: user.email,
          name: user.name,
          otp: rawOtp,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verify 6-digit OTP
   * POST /api/auth/verify-otp
   */
  public async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email and OTP are required' });
        return;
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.otpHash || !user.otpExpiresAt) {
        res.status(400).json({ success: false, message: 'No active OTP request found for this email' });
        return;
      }

      // Check expiration
      if (new Date() > new Date(user.otpExpiresAt)) {
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        await user.save();
        res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        return;
      }

      // Check max attempt limit (5 attempts)
      if (user.otpAttempts >= 5) {
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        await user.save();
        res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. This OTP is invalidated. Please request a new one.',
        });
        return;
      }

      const isOtpValid = await bcrypt.compare(String(otp).trim(), user.otpHash);
      if (!isOtpValid) {
        user.otpAttempts += 1;
        await user.save();
        res.status(400).json({
          success: false,
          message: `Invalid OTP code. Attempts remaining: ${5 - user.otpAttempts}`,
        });
        return;
      }

      // Generate a short-lived reset token (valid for 15 minutes)
      const resetToken = jwt.sign(
        { userId: user._id.toString(), email: user.email, purpose: 'PASSWORD_RESET' },
        env.JWT_SECRET as string,
        { expiresIn: '15m' }
      );

      res.json({
        success: true,
        message: 'OTP verified successfully.',
        resetToken,
        data: { resetToken },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset Password with Verified Token or OTP
   * POST /api/auth/reset-password
   */
  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, resetToken, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
        return;
      }

      let targetUser: IUser | null = null;

      if (resetToken) {
        try {
          const decoded = jwt.verify(resetToken, env.JWT_SECRET as string) as any;
          if (decoded.purpose !== 'PASSWORD_RESET') {
            res.status(400).json({ success: false, message: 'Invalid reset token' });
            return;
          }
          targetUser = await User.findById(decoded.userId);
        } catch {
          res.status(400).json({ success: false, message: 'Reset token has expired or is invalid' });
          return;
        }
      } else if (email && otp) {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.otpHash || !user.otpExpiresAt) {
          res.status(400).json({ success: false, message: 'No active OTP request found' });
          return;
        }

        if (new Date() > new Date(user.otpExpiresAt)) {
          res.status(400).json({ success: false, message: 'OTP has expired' });
          return;
        }

        const isMatch = await bcrypt.compare(String(otp).trim(), user.otpHash);
        if (!isMatch) {
          res.status(400).json({ success: false, message: 'Invalid OTP code' });
          return;
        }
        targetUser = user;
      } else {
        res.status(400).json({ success: false, message: 'Reset token or email with OTP is required' });
        return;
      }

      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Hash and update password
      const salt = await bcrypt.genSalt(10);
      targetUser.passwordHash = await bcrypt.hash(newPassword, salt);
      targetUser.otpHash = undefined;
      targetUser.otpExpiresAt = undefined;
      targetUser.otpAttempts = 0;
      await targetUser.save();

      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get User Profile
   * GET /api/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId).select('-passwordHash -otpHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'Profile not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update User Profile & Password
   * PUT /api/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const { name, phone, avatar, currentPassword, newPassword } = req.body;

      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (avatar !== undefined) user.avatar = avatar;

      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({ success: false, message: 'Current password is required to change password' });
          return;
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          res.status(400).json({ success: false, message: 'Current password is incorrect' });
          return;
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const stockSenseAuthController = new StockSenseAuthController();
