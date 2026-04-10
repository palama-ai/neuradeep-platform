const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken } = require('../utils/auth');
const { authMiddleware } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../services/cloudinary.service');
const crypto = require('crypto');
const router = express.Router();
const prisma = new PrismaClient();

// Helper to handle BigInt serialization
const serializeUser = (user) => {
  return JSON.parse(JSON.stringify(user, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

router.post('/signup', async (req, res) => {
  const { email, password, fullName, referralCode: appliedCode } = req.body;
  const referralCodeQuery = req.query.ref;
  const finalAppliedCode = appliedCode || referralCodeQuery;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    
    // 1. Generate branded referral code for new user
    const userReferralCode = "PALM-" + crypto.randomBytes(3).toString('hex').toUpperCase();

    // 2. Create the user within a transaction to handle referral bonus
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ 
        data: { 
          email, 
          passwordHash, 
          fullName,
          referralCode: userReferralCode,
          credits: 500,        // Starting bonus
          creditsTotal: 500
        } 
      });

      // 3. Handle Referral Bonus if code provided
      if (finalAppliedCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: finalAppliedCode }
        });

        if (referrer && referrer.id !== newUser.id) {
          // Bonus to referrer
          const updatedReferrer = await tx.user.update({
            where: { id: referrer.id },
            data: {
              credits: { increment: 500 },
              creditsTotal: { increment: 500 },
              referralCount: { increment: 1 },
              referralEarnings: { increment: 500 },
            }
          });

          // Extra bonus to new user (Referee)
          const updatedReferee = await tx.user.update({
            where: { id: newUser.id },
            data: {
              credits: { increment: 500 },
              creditsTotal: { increment: 1000 }, // 500 signup + 500 ref
              referredBy: finalAppliedCode,
            }
          });

          // Record the referral
          await tx.referral.create({
            data: {
              referrerId: referrer.id,
              refereeId: newUser.id,
              creditsAwarded: 500
            }
          });

          // Logs
          await tx.creditLog.create({
            data: {
              userId: referrer.id,
              amount: 500,
              type: 'referral_bonus',
              description: `Referral bonus: ${email} joined via your link`,
              balanceAfter: updatedReferrer.credits
            }
          });

          await tx.creditLog.create({
            data: {
              userId: newUser.id,
              amount: 500,
              type: 'referral_bonus',
              description: `Ref bonus: joined via referral from ${referrer.email}`,
              balanceAfter: updatedReferee.credits
            }
          });

          return { user: updatedReferee, bonusApplied: true };
        }
      }

      // Initial signup log
      await tx.creditLog.create({
        data: {
          userId: newUser.id,
          amount: 500,
          type: 'signup_bonus',
          description: 'Welcome bonus for joining Palama Persona',
          balanceAfter: 500
        }
      });

      return { user: newUser, bonusApplied: false };
    });

    res.status(201).json({ 
      accessToken: generateAccessToken(result.user), 
      user: { 
        id: result.user.id, 
        email: result.user.email, 
        role: result.user.role,
        bonusApplied: result.bonusApplied
      } 
    });
  } catch (err) { 
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'Email already registered. Please login instead.' });
    }
    console.error('[Signup Error]:', err);
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
      user: { id: user.id, email: user.email, role: user.role, profileImage: user.profileImage } 
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
        credits: true,
        creditsTotal: true,
        creditsConsumed: true,
        referralCode: true,
        referralCount: true,
        referralEarnings: true,
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
