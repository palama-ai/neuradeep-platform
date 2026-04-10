const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/auth.middleware');
const crypto = require('crypto');

const REFERRAL_BONUS = 500; // Credits for both referrer and referee

// ═══════════════════════════════════════════════════
// GET /api/v1/referral/code
// ═══════════════════════════════════════════════════
router.get('/code', authMiddleware, async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { referralCode: true, referralCount: true, referralEarnings: true }
    });

    // Generate code if not exists or if it's a UUID (cleanup)
    const isUuid = user.referralCode && user.referralCode.includes('-');
    const isBranded = user.referralCode && user.referralCode.startsWith('PALM-');

    if (!user.referralCode || (isUuid && !isBranded)) {
      const code = "PALM-" + crypto.randomBytes(3).toString('hex').toUpperCase();
      user = await prisma.user.update({
        where: { id: req.user.id },
        data: { referralCode: code },
        select: { referralCode: true, referralCount: true, referralEarnings: true }
      });
    }

    res.json({
      code: user.referralCode,
      link: `https://palama.vercel.app/ref/${user.referralCode}`,
      totalReferrals: user.referralCount,
      totalEarnings: user.referralEarnings,
      bonusPerReferral: REFERRAL_BONUS,
    });
  } catch (err) {
    console.error('[Referral] Code error:', err);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/v1/referral/apply
// ═══════════════════════════════════════════════════
router.post('/apply', authMiddleware, async (req, res) => {
  const { referralCode } = req.body;

  if (!referralCode) {
    return res.status(400).json({ error: 'No referral code provided' });
  }

  try {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode }
    });

    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    if (referrer.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot use your own referral code' });
    }

    const existingReferral = await prisma.referral.findUnique({
      where: { refereeId: req.user.id }
    });

    if (existingReferral) {
      return res.status(400).json({ error: 'Referral already applied' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Give referrer bonus
      const updatedReferrer = await tx.user.update({
        where: { id: referrer.id },
        data: {
          credits: { increment: REFERRAL_BONUS },
          creditsTotal: { increment: REFERRAL_BONUS },
          referralCount: { increment: 1 },
          referralEarnings: { increment: REFERRAL_BONUS },
        }
      });

      // 2. Give referee bonus
      const updatedReferee = await tx.user.update({
        where: { id: req.user.id },
        data: {
          credits: { increment: REFERRAL_BONUS },
          creditsTotal: { increment: REFERRAL_BONUS },
          referredBy: referralCode,
        }
      });

      // 3. Create referral record
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          refereeId: req.user.id,
          creditsAwarded: REFERRAL_BONUS,
        }
      });

      // 4. Logs
      await tx.creditLog.create({
        data: {
          userId: referrer.id,
          amount: REFERRAL_BONUS,
          type: 'referral_bonus',
          description: `Referral bonus: ${req.user.email} joined via your link`,
          balanceAfter: updatedReferrer.credits,
        }
      });

      await tx.creditLog.create({
        data: {
          userId: req.user.id,
          amount: REFERRAL_BONUS,
          type: 'referral_bonus',
          description: `Welcome bonus: joined via referral from ${referrer.email}`,
          balanceAfter: updatedReferee.credits,
        }
      });
    });

    res.json({
      success: true,
      bonusAwarded: REFERRAL_BONUS,
      message: `Success! You and your friend each received ${REFERRAL_BONUS} credits!`
    });
  } catch (err) {
    console.error('[Referral] Apply error:', err);
    res.status(500).json({ error: 'Failed to apply referral' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/v1/referral/stats
// ═══════════════════════════════════════════════════
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [user, referrals] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { referralCode: true, referralCount: true, referralEarnings: true }
      }),
      prisma.referral.findMany({
        where: { referrerId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          referee: {
            select: { fullName: true, email: true, createdAt: true }
          }
        }
      })
    ]);

    res.json({
      code: user.referralCode,
      link: `https://palama.vercel.app/ref/${user.referralCode}`,
      totalReferrals: user.referralCount,
      totalEarnings: user.referralEarnings,
      bonusPerReferral: REFERRAL_BONUS,
      recentReferrals: referrals.map(r => ({
        name: r.referee.fullName || 'Anonymous',
        email: r.referee.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        date: r.createdAt.toISOString(),
      }))
    });
  } catch (err) {
    console.error('[Referral] Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

module.exports = router;
