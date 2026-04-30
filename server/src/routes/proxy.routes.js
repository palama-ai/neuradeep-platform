// f:/palama-persona-v1/neuradeepai-platform/server/src/routes/proxy.routes.js

const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

/**
 * GET /api/v1/proxy/voice/token
 * Generate a short-lived Deepgram token for the desktop client
 */
router.get('/voice/token', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [user, deepgramKeyDoc] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.apiKey.findFirst({
        where: { provider: 'deepgram', isActive: true }
      })
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Credit Check
    if (user.credits < 1) {
      return res.status(429).json({ 
        error: 'insufficient_credits',
        message: 'Your balance is 0. Please add credits to use voice.'
      });
    }

    if (!deepgramKeyDoc) {
      return res.status(503).json({ error: 'Deepgram Voice API is currently unavailable (No key configured)' });
    }

    const masterKey = deepgramKeyDoc.apiKey;

    // 1. Get the Project ID from Deepgram
    const projectRes = await axios.get('https://api.deepgram.com/v1/projects', {
      headers: { 'Authorization': `Token ${masterKey}` }
    });

    if (!projectRes.data || !projectRes.data.projects || projectRes.data.projects.length === 0) {
       return res.status(500).json({ error: 'No Deepgram project found for this API key' });
    }

    const projectId = projectRes.data.projects[0].project_id;

    // 2. Generate a Temporary Token (valid for 1 hour)
    const tokenRes = await axios.post(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
      comment: `Palama Desktop Session - User ${userId}`,
      scopes: ["usage:write"],
      time_to_live_in_seconds: 3600 // 1 hour expiration
    }, {
      headers: { 
        'Authorization': `Token ${masterKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tokenRes.data || !tokenRes.data.key) {
       return res.status(500).json({ error: 'Failed to generate Deepgram temporary token' });
    }

    res.json({ key: tokenRes.data.key, expires_in: 3600 });

  } catch (err) {
    console.error('[Voice Token Proxy Error]:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message;
    res.status(status).json({ error: `Voice Service Error (${status}): ${msg}` });
  }
});

module.exports = router;
