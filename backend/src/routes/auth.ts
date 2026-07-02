import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-luxury-car-rental-key-change-in-prod';

// Simple OTP cache for mock OTP verification
const otpCache: Record<string, { otp: string; expires: number }> = {};

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phoneNumber: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        phoneNumber: body.phoneNumber || null,
        role: 'CUSTOMER',
        idVerificationStatus: 'NOT_SUBMITTED'
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Create activity log
    await prisma.activityLog.create({
      data: { userId: user.id, action: 'SIGNUP', details: 'User registered account' }
    });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phoneNumber: user.phoneNumber, idVerificationStatus: user.idVerificationStatus }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid signup data' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'LOGIN', details: 'User logged in' }
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        idVerificationStatus: user.idVerificationStatus
      }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid login details' });
  }
});

// Mock Google Login
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, imageUrl } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Google email and name are required' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create user with random password
      const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          avatarUrl: imageUrl || null,
          role: 'CUSTOMER',
          idVerificationStatus: 'NOT_SUBMITTED'
        }
      });
      await prisma.activityLog.create({
        data: { userId: user.id, action: 'SIGNUP', details: 'User registered via Google' }
      });
    } else {
      // Update avatar if provided
      if (imageUrl && !user.avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: imageUrl }
        });
      }
      await prisma.activityLog.create({
        data: { userId: user.id, action: 'LOGIN', details: 'User logged in via Google' }
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        idVerificationStatus: user.idVerificationStatus
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// Send OTP Simulation (Indian standard mobile OTP)
router.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache[phoneNumber] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  };

  console.log(`[SMS Gateway Mock] OTP for ${phoneNumber}: ${otp}`);

  // In production, trigger SMS gateway (e.g. Twilio or Gupshup)
  res.json({ message: 'OTP sent successfully (Simulated)', devOtp: otp });
});

// Verify OTP Simulation
router.post('/verify-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP are required' });
  }

  const cached = otpCache[phoneNumber];
  if (!cached || cached.expires < Date.now()) {
    return res.status(400).json({ message: 'OTP expired or not requested' });
  }

  if (cached.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP entered' });
  }

  delete otpCache[phoneNumber];
  res.json({ message: 'OTP verified successfully' });
});

// Forgot Password Request
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate a mock reset token
  const resetToken = Math.random().toString(36).substring(2);
  console.log(`[Email Gateway Mock] Password Reset Link for ${email}: http://localhost:3000/reset-password?token=${resetToken}`);

  res.json({ message: 'Password reset link sent to registered email' });
});

// Get Profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        documents: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      idVerificationStatus: user.idVerificationStatus,
      idVerificationComments: user.idVerificationComments,
      documents: user.documents,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, phoneNumber, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        name,
        phoneNumber,
        avatarUrl
      }
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: 'UPDATE_PROFILE', details: 'User updated profile details' }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        idVerificationStatus: user.idVerificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Delete Account
router.delete('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Prevent deleting admin account
    if (req.user?.role === 'ADMIN') {
      return res.status(400).json({ message: 'Admin accounts cannot be deleted directly' });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
