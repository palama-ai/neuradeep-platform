const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/tokens/consume
 * Deduct tokens from user's remote (Neon DB) account.
 */
router.get('/balance', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokensLimitMonthly: true, tokensUsedTotal: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const total = user.tokensLimitMonthly;
    const used = user.tokensUsedTotal;
    const balance = total - used > 0n ? total - used : 0n;

    res.json({
      success: true,
      balance: balance.toString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance: ' + err.message });
  }
});

/**
 * POST /api/v1/tokens/consume
 * Deduct tokens from user's remote (Neon DB) account.
 */
router.post('/consume', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { amount, category, task } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // 1. Convert amount to BigInt if it's float (round it)
    const tokenIncrement = BigInt(Math.round(amount));

    // 2. Atomic update to increments used tokens
    const [usageLog, updatedUser] = await prisma.$transaction([
      prisma.usageLog.create({
        data: {
          userId,
          model: 'palama-agent-operational',
          provider: 'local-agent',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: Number(tokenIncrement),
          costUsd: 0,
          taskType: 'operational',
          // Note: Since UsageLog doesn't have a 'task' field in schema, we skip it
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { tokensUsedTotal: { increment: tokenIncrement } }
      })
    ]);

    const total = updatedUser.tokensLimitMonthly;
    const used = updatedUser.tokensUsedTotal;
    const balance = total - used > 0n ? total - used : 0n;

    res.json({
      success: true,
      balance: balance.toString(),
      used: used.toString()
    });

  } catch (err) {
    console.error('Remote Token Consumption Error:', err.message);
    res.status(500).json({ error: 'Failed to update remote tokens: ' + err.message });
  }
});

/**
 * POST /api/v1/tokens/refund
 * Refund tokens to user's remote account (Admin or system initiated).
 */
router.post('/refund', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { amount, task } = req.body;
  
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
  
    try {
      const tokenDecrement = BigInt(Math.round(amount));
  
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          tokensUsedTotal: { 
            decrement: tokenDecrement 
          } 
        }
      });
  
      res.json({
        success: true,
        balance: (updatedUser.tokensLimitMonthly - updatedUser.tokensUsedTotal).toString()
      });
    } catch (err) {
      res.status(500).json({ error: 'Refund failed: ' + err.message });
    }
  });

module.exports = router;
