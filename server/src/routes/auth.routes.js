const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken } = require('../utils/auth');
const { authMiddleware } = require('../middleware/auth.middleware');
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
  } catch (err) { res.status(500).json({ error: err.message }); }
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

module.exports = router;
