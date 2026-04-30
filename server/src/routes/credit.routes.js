const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware } = require('../middleware/auth.middleware');

// ═══════════════════════════════════════════════════
// NEW CREDIT PRICING MODEL
// ═══════════════════════════════════════════════════
const INPUT_RATE = 3;    // bits per 1K input tokens
const OUTPUT_RATE = 6;   // bits per 1K output tokens
const MIN_CHARGE = 1;    // minimum 1 bit per call

const MODEL_MULTIPLIERS = {
  'qwen/qwen3-vl-235b-a22b-instruct': 1.0,
  'qwen/qwen3.5-flash': 1.0, // Core model: 1k tokens = 1 credit
  'qwen/qwen3.5-flash-02-23': 1.0,
  'groq:deepseek-r1-distill-llama-70b': 1.2,
  'openai/gpt-4o-mini': 1.0,
  'anthropic/claude-3-haiku': 1.0,
  'anthropic/claude-3.5-sonnet': 3.0,
};

function getMultiplier(model) {
  return MODEL_MULTIPLIERS[model] || 1.0;
}

function calculateCredits(inputTokens, outputTokens, model) {
  const multiplier = getMultiplier(model);
  const inputCost = (inputTokens / 1000) * INPUT_RATE;
  const outputCost = (outputTokens / 1000) * OUTPUT_RATE;
  const total = (inputCost + outputCost) * multiplier;
  return Math.max(MIN_CHARGE, Math.round(total));
}

function detectProvider(model) {
  if (!model) return 'unknown';
  const m = model.toLowerCase();
  if (m.includes('qwen') || m.includes('llama') || m.includes('openai') || m.includes('anthropic') || m.includes('moonshot')) return 'openrouter';
  if (m.includes('gemini')) return 'gemini';
  return 'openrouter';
}

// ═══════════════════════════════════════════════════
// GET /api/v1/credits/balance
// ═══════════════════════════════════════════════════
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        credits: true,
        creditsTotal: true,
        creditsConsumed: true,
        plan: true,
        planCreditsMonthly: true,
        referralCode: true,
        referralCount: true,
        referralEarnings: true,
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      balance: user.credits,
      totalEarned: user.creditsTotal,
      totalConsumed: user.creditsConsumed,
      plan: user.plan,
      monthlyAllowance: user.planCreditsMonthly,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralEarnings: user.referralEarnings,
    });
  } catch (err) {
    console.error('[Credits] Balance error:', err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/v1/credits/consume
router.post('/consume', authMiddleware, async (req, res) => {
  const { inputTokens = 0, outputTokens = 0, model = 'unknown', 
          taskType = 'general', description = '' } = req.body;

  try {
    let cost = 0;
    
    // Voice Mode Specific Billing
    if (taskType === 'voice_minute') {
      cost = 3; // 3 Credits per minute
    } else if (taskType === 'voice_session') {
      cost = 5; // 5 Credits per session (2-3 min)
    } else {
      // Standard Token Billing
      cost = calculateCredits(inputTokens, outputTokens, model);
    }

    const multiplier = taskType.startsWith('voice') ? 1.0 : getMultiplier(model);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { credits: true }
      });

      if (!user) throw new Error('User not found');

      if (user.credits < cost) {
        return { 
          success: false, 
          error: 'insufficient_credits',
          balance: user.credits,
          required: cost
        };
      }


      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          credits: { decrement: cost },
          creditsConsumed: { increment: cost },
        }
      });

      await tx.creditLog.create({
        data: {
          userId: req.user.id,
          amount: -cost,
          type: 'consume',
          model: model,
          provider: detectProvider(model),
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          multiplier: multiplier,
          taskType: taskType,
          description: description.substring(0, 200),
          balanceAfter: updatedUser.credits,
        }
      });

      // 📊 POPULATE USAGE LOG: Necessary for Admin Dashboard aggregation
      await tx.usageLog.create({
        data: {
          userId: req.user.id,
          model: model,
          provider: detectProvider(model),
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd: 0, // Simplified for now
          taskType: taskType
        }
      });

      return { success: true, consumed: cost, balance: updatedUser.credits };
    });

    if (!result.success) {
      return res.status(429).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('[Credits] Consume error:', err);
    res.status(500).json({ error: 'Failed to consume credits' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/v1/credits/refund
// ═══════════════════════════════════════════════════
router.post('/refund', authMiddleware, async (req, res) => {
  const { amount = 0, description = 'Task refund' } = req.body;

  if (amount <= 0) return res.json({ success: true, refunded: 0 });

  try {
    const requestedRefund = Math.round(amount);

    // 🛡️ Security: Prevent refund fraud (DEEP-03 fix)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { creditsConsumed: true }
      });

      if (!user) throw new Error('User not found');

      // Cap the refund to what the user has actually consumed
      const refundAmount = Math.min(requestedRefund, user.creditsConsumed);

      if (refundAmount <= 0) {
        return { success: true, refunded: 0, balance: user.credits };
      }

      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          credits: { increment: refundAmount },
          creditsConsumed: { decrement: refundAmount },
        }
      });
      return { success: true, refunded: refundAmount, updatedUser };
    });

    if (result.refunded === 0) {
       return res.json({ success: true, refunded: 0, balance: result.balance || 0 });
    }

    const updatedUser = result.updatedUser;

    await prisma.creditLog.create({
      data: {
        userId: req.user.id,
        amount: refundAmount,
        type: 'refund',
        description: description.substring(0, 200),
        balanceAfter: updatedUser.credits,
      }
    });

    res.json({ success: true, refunded: refundAmount, balance: updatedUser.credits });
  } catch (err) {
    console.error('[Credits] Refund error:', err);
    res.status(500).json({ error: 'Failed to refund' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/v1/credits/history
// ═══════════════════════════════════════════════════
router.get('/history', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  try {
    const where = { userId: req.user.id };

    const [logs, total] = await Promise.all([
      prisma.creditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.creditLog.count({ where })
    ]);

    res.json({
      history: logs.map(l => ({
        ...l,
        id: l.id.toString(), // BigInt to string
        time: l.createdAt.toISOString(),
      })),
      pagination: {
        page,
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    console.error('[Credits] History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
