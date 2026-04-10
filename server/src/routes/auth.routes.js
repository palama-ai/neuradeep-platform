const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken } = require('../utils/auth');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../services/cloudinary.service');
const router = express.Router();
const prisma = new PrismaClient();

// Helper to handle BigInt serialization
const serializeUser = (user) => {
  return JSON.parse(JSON.stringify(user, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

router.post('/signup', async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, passwordHash, fullName } });
    res.status(201).json({ accessToken: generateAccessToken(user), user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) { 
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'Email already registered. Please login instead.' });
    }
    res.status(500).json({ error: 'Signup failed: ' + err.message }); 
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { callback } = req.query;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid creds' });
    }

    const accessToken = generateAccessToken(user);
    let redirectUrl = null;

    if (callback) {
      const url = new URL(callback);
      url.searchParams.set('token', accessToken);
      redirectUrl = url.toString();
    }

    res.json({ 
      accessToken, 
      redirectUrl,
      user: { id: user.id, email: user.email, role: user.role } 
    });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// ─── Profile & User Data ───

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        profileImage: true,
        role: true,
        plan: true,
        tokensLimitMonthly: true,
        tokensUsedTotal: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(serializeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/profile', authMiddleware, async (req, res) => {
  const { fullName, password } = req.body;
  const updateData = {};

  if (fullName) updateData.fullName = fullName;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });
    res.json({ success: true, user: { id: user.id, fullName: user.fullName } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Avatar Upload (Cloudinary) ───

router.post('/avatar', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { avatar } = req.body;

  if (!avatar) {
    return res.status(400).json({ error: 'No avatar data provided' });
  }

  try {
    // Upload to Cloudinary
    const { url } = await uploadAvatar(avatar, userId);

    // Save URL to database
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: url }
    });

    res.json({ success: true, profileImage: url });
  } catch (err) {
    console.error('[Avatar Upload Error]:', err.message);
    res.status(500).json({ error: 'Avatar upload failed: ' + err.message });
  }
});

module.exports = router;
