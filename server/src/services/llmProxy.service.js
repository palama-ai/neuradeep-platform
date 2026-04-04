// f:/palama-persona-v1/neuradeepai-platform/server/src/services/llmProxy.service.js

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { decrypt } = require('../utils/encryption');

const prisma = new PrismaClient();

/**
 * Calculate usage for the current month on-the-fly
 */
async function getMonthlyUsage(userId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.usageLog.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfMonth }
    },
    _sum: { totalTokens: true }
  });

  return Number(usage._sum.totalTokens || 0);
}

/**
 * Detect provider based on model name
 */
const detectProvider = (model) => {
  const m = model.toLowerCase();
  if (m.includes('groq')) return 'groq';
  if (m.includes('gemini') || m.includes('google')) return 'gemini';
  return 'openrouter'; // Default
};

/**
 * Forward request to the actual AI provider
 */
async function forwardRequest(provider, encryptedKey, data) {
  const apiKey = decrypt(encryptedKey);
  if (!apiKey) throw new Error('Failed to decrypt provider API key');

  let url = '';
  let headers = { 'Content-Type': 'application/json' };

  switch (provider) {
    case 'groq':
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'gemini':
      // Strip 'google/' or 'gemini/' if present
      const geminiModel = data.model.replace(/^(google|gemini)\//i, '');
      url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${apiKey}`;
      data.model = geminiModel;
      break;
    default: // OpenRouter
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'https://neuradeepai.com';
      headers['X-Title'] = 'NeuraDeepAI Platform';
  }

  // Final cleanup for Groq too
  if (provider === 'groq') {
    data.model = data.model.replace(/^groq\//i, '');
  }

  const response = await axios.post(url, data, { headers });
  return response.data;
}

module.exports = {
  getMonthlyUsage,
  detectProvider,
  forwardRequest
};
