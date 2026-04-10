const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

// Default model values (used when DB has no entry)
const DEFAULTS = {
  THINKING_MODEL: 'groq:deepseek-r1-distill-llama-70b',
  VISION_MODEL: 'qwen/qwen3-vl-235b-instruct',
  CHAT_MODEL: 'openai/gpt-4o-mini'
};

/**
 * GET /api/v1/config/models
 * Public endpoint for Palama Agent to fetch orchestration rules.
 * Source of truth: NeonDB GlobalConfig table. Falls back to code defaults.
 */
router.get('/models', async (req, res) => {
  try {
    const configs = await prisma.globalConfig.findMany();
    const modelMap = {};
    configs.forEach(c => {
      modelMap[c.key] = c.value;
    });

    res.json({
      thinking_model: modelMap['THINKING_MODEL'] || DEFAULTS.THINKING_MODEL,
      vision_model: modelMap['VISION_MODEL'] || DEFAULTS.VISION_MODEL,
      chat_model: modelMap['CHAT_MODEL'] || DEFAULTS.CHAT_MODEL
    });
  } catch (err) {
    // DB unreachable — return code defaults (no filesystem dependency)
    res.json({
      thinking_model: DEFAULTS.THINKING_MODEL,
      vision_model: DEFAULTS.VISION_MODEL,
      chat_model: DEFAULTS.CHAT_MODEL,
      source: 'Code Defaults (DB unreachable)'
    });
  }
});

/**
 * GET /api/v1/admin/config/admin
 * List all configs for the Admin UI
 */
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const configs = await prisma.globalConfig.findMany();
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch configs: ' + err.message });
  }
});

/**
 * POST /api/v1/admin/config/admin
 * Update or Create a config key (DB only, no filesystem)
 */
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ error: 'Key and Value required' });

  try {
    const config = await prisma.globalConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json({ message: 'Config updated', config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update config: ' + err.message });
  }
});

module.exports = router;
