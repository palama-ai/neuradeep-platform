// f:/palama-persona-v1/neuradeepai-platform/server/src/routes/proxy.routes.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getMonthlyUsage, detectProvider, forwardRequest } = require('../services/llmProxy.service');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/chat/completions
 * The main LLM proxy endpoint
 */
router.post('/completions', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { model, messages, stream } = req.body;

  if (stream) {
    return res.status(400).json({ error: 'Streaming is not yet supported in this version' });
  }

  try {
    // 1. Get user profile and check monthly usage
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentUsage = await getMonthlyUsage(userId);
    if (BigInt(currentUsage) >= user.tokensLimitMonthly) {
      return res.status(429).json({
        error: 'Monthly token limit exceeded',
        usage: currentUsage,
        limit: user.tokensLimitMonthly.toString(),
        upgrade_url: 'https://neuradeepai.com/dashboard/plans'
      });
    }

    // 2. Identify provider and fetch API key
    const provider = detectProvider(model);
    const apiKeyDoc = await prisma.apiKey.findFirst({
      where: { provider, isActive: true }
    });

    if (!apiKeyDoc) {
      return res.status(503).json({ error: `Provider ${provider} is currently unavailable` });
    }

    // 3. Forward request to actual LLM
    const llmResponse = await forwardRequest(provider, apiKeyDoc.apiKey, req.body);

    // 4. Log usage and update user atoms
    const tokens = llmResponse.usage;
    if (tokens) {
      const { prompt_tokens, completion_tokens, total_tokens } = tokens;
      
      // Atomic usage logging
      await prisma.$transaction([
        prisma.usageLog.create({
          data: {
            userId,
            model,
            provider,
            inputTokens: prompt_tokens,
            outputTokens: completion_tokens,
            totalTokens: total_tokens,
            costUsd: 0, // Simplified for now
            taskType: 'chat'
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { tokensUsedTotal: { increment: BigInt(total_tokens) } }
        })
      ]);
    }

    // 5. Return LLM response to client
    res.json(llmResponse);

  } catch (err) {
    console.error('Proxy Error:', err.message);
    res.status(500).json({ error: 'LLM Error: ' + (err.response?.data?.error?.message || err.message) });
  }
});

module.exports = router;
