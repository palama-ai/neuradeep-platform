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
    // 1. Parallelize user profile and API key lookup for speed
    const provider = detectProvider(model);
    const [user, apiKeyDoc] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.apiKey.findFirst({
        where: { provider, isActive: true }
      })
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // 2. Strict Credit Check
    if (user.credits < 1) {
      return res.status(429).json({ 
        error: 'insufficient_credits',
        message: 'Your balance is 0. Please share your referral code to get more credits.'
      });
    }

    if (!apiKeyDoc) return res.status(503).json({ error: `Provider for ${model} is currently unavailable` });

    // 3. Forward request to actual LLM
    const llmResponse = await forwardRequest(provider, apiKeyDoc.apiKey, req.body);

    // 4. Return LLM response to client
    res.json(llmResponse);

    // 5. Background Work: Update API Key spend stats only
    const tokens = llmResponse.usage;
    if (tokens) {
      (async () => {
        try {
          const input_tokens = tokens.prompt_tokens || tokens.promptTokens || 0;
          const output_tokens = tokens.completion_tokens || tokens.completionTokens || 0;
          
          const MODEL_PRICES = {
            'groq': { in: 0.5, out: 0.5 },
            'gemini': { in: 0.35, out: 1.05 },
            'openrouter': { in: 1.0, out: 2.0 }
          };
          
          const rates = MODEL_PRICES[provider] || { in: 0, out: 0 };
          const costUsd = ((input_tokens / 1000000) * rates.in) + ((output_tokens / 1000000) * rates.out);

          await prisma.apiKey.update({
            where: { id: apiKeyDoc.id },
            data: { currentSpend: { increment: costUsd } }
          });
        } catch (logErr) {
          console.error('[Background Spend Update Error]:', logErr.message);
        }
      })();
    }

  } catch (err) {
    console.error('[Proxy Error Details]:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message;
    res.status(status).json({ error: `LLM Proxy Error (${status}): ${msg}` });
  }
});

module.exports = router;
