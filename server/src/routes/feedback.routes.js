const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');
const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/feedback
 * Receives user feedback (rating + comment)
 * Awards 100 credits if user hasn't received reward in last 48 hours.
 */
router.post('/', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid rating (1-5) is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastFeedbackAt: true, credits: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    
    // Check if eligible for reward (not since last 48h)
    const isEligible = !user.lastFeedbackAt || user.lastFeedbackAt < fortyEightHoursAgo;

    // Create Feedback record
    await prisma.feedback.create({
      data: {
        userId,
        rating: parseInt(rating),
        comment: comment || ''
      }
    });

    let message = 'Thank you for your feedback!';
    let rewardApplied = false;

    if (isEligible) {
      // Award 100 credits
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: 100 },
          creditsTotal: { increment: 100 },
          lastFeedbackAt: now
        }
      });

      // Log credit transaction
      await prisma.creditLog.create({
        data: {
          userId,
          amount: 100,
          type: 'feedback_bonus',
          description: 'Reward for providing app feedback',
          balanceAfter: updatedUser.credits
        }
      });

      rewardApplied = true;
      message = 'Thank you for your feedback! 100 Credits have been added to your account.';
    } else {
      message = 'Thank you for your feedback! Since you recently provided feedback, no reward was added this time.';
    }

    res.json({
      success: true,
      message,
      rewardApplied,
      nextEligibleAt: new Date(now.getTime() + (48 * 60 * 60 * 1000))
    });

  } catch (err) {
    console.error('[Feedback Error]:', err);
    res.status(500).json({ error: 'Failed to submit feedback: ' + err.message });
  }
});

module.exports = router;
