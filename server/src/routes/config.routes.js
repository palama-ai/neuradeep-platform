// f:/palama-persona-v1/neuradeepai-platform/server/src/routes/config.routes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();
const CONFIG_FILE = path.join(__dirname, '../../system_config.json');

// Helper to read JSON fallback
const getJsonConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
};

// Helper to save JSON fallback
const saveJsonConfig = (key, value) => {
  const current = getJsonConfig();
  current[key] = value;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(current, null, 2));
};

/**
 * GET /api/v1/config/models
 * Public endpoint for Palama Agent to fetch orchestration rules
 */
router.get('/models', async (req, res) => {
  try {
    const configs = await prisma.globalConfig.findMany();
    const modelMap = {};
    configs.forEach(c => {
      modelMap[c.key] = c.value;
    });

    res.json({
      thinking_model: modelMap['THINKING_MODEL'] || 'groq:deepseek-r1-distill-llama-70b',
      vision_model: modelMap['VISION_MODEL'] || 'qwen/qwen3-vl-235b-instruct',
      chat_model: modelMap['CHAT_MODEL'] || 'openai/gpt-4o-mini'
    });
  } catch (err) {
    // Fallback to JSON if DB table doesn't exist yet
    const map = getJsonConfig();
    res.json({
      thinking_model: map['THINKING_MODEL'] || 'groq:deepseek-r1-distill-llama-70b',
      vision_model: map['VISION_MODEL'] || 'qwen/qwen3-vl-235b-instruct',
      chat_model: map['CHAT_MODEL'] || 'openai/gpt-4o-mini',
      source: 'JSON Fallback'
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
    // If DB fails, return JSON as a flat list for the UI
    const map = getJsonConfig();
    const list = Object.keys(map).map(k => ({ key: k, value: map[k] }));
    res.json(list);
  }
});

/**
 * POST /api/v1/admin/config/admin
 * Update or Create a config key
 */
router.post('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ error: 'Key and Value required' });

  try {
    // Always update JSON first for maximum robustness on Windows
    saveJsonConfig(key, value);

    // Try updating DB
    const config = await prisma.globalConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    res.json({ message: 'Config updated in DB and JSON', config });
  } catch (err) {
    // If DB fails, we still have the JSON update
    res.json({ message: 'Config updated (JSON Fallback)', key, value });
  }
});

module.exports = router;
