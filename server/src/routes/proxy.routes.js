// f:/palama-persona-v1/neuradeepai-platform/server/src/routes/proxy.routes.js

const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getMonthlyUsage, detectProvider, forwardRequest } = require('../services/llmProxy.service');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'neuradeep_platform_secret_2026';

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
      // 4.1. Accurately extract input and output tokens, handling both snake_case and camelCase
      const input_tokens = tokens.prompt_tokens || tokens.promptTokens || 0;
      const output_tokens = tokens.completion_tokens || tokens.completionTokens || 0;
      const t_tokens = tokens.total_tokens || tokens.totalTokens || (input_tokens + output_tokens);

      // 4.2. Calculate fractional cost based on provider (estimation per 1M tokens)
      const MODEL_PRICES = {
        'groq': { in: 0.5, out: 0.5 },
        'gemini': { in: 0.35, out: 1.05 },
        'openrouter': { in: 1.0, out: 2.0 }
      };
      
      const rates = MODEL_PRICES[provider] || { in: 0, out: 0 };
      const costUsd = ((input_tokens / 1000000) * rates.in) + ((output_tokens / 1000000) * rates.out);

      // Atomic usage logging and spend increment
      await prisma.$transaction([
        prisma.usageLog.create({
          data: {
            userId,
            model,
            provider,
            inputTokens: input_tokens,
            outputTokens: output_tokens,
            totalTokens: t_tokens,
            costUsd: costUsd,
            taskType: 'chat'
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { tokensUsedTotal: { increment: BigInt(t_tokens) } }
        }),
        prisma.apiKey.update({
          where: { id: apiKeyDoc.id },
          data: { currentSpend: { increment: costUsd } }
        })
      ]);
    }

    // 5. Return LLM response to client
    res.json(llmResponse);

  } catch (err) {
    console.error('[Proxy Error Details]:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message;
    res.status(status).json({ error: `LLM Proxy Error (${status}): ${msg}` });
  }
});

module.exports = router;
