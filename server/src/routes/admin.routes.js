// f:/palama-persona-v1/neuradeepai-platform/server/src/routes/admin.routes.js

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { encrypt } = require('../utils/encryption');

const router = express.Router();
const prisma = new PrismaClient();

// All routes here require Admin JWT
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/v1/admin/users
 * List all users with basic info
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        plan: true,
        credits: true,
        creditsConsumed: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map(u => ({
      ...u,
      creditsConsumed: u.creditsConsumed?.toString() || '0'
    }));

    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/v1/admin/users/:id
 * Update user plan, role or status
 */
router.put('/users/:id', async (req, res) => {
    const { plan, role, isActive, planCreditsMonthly } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { 
        plan, 
        role, 
        isActive, 
        planCreditsMonthly: planCreditsMonthly ? parseInt(planCreditsMonthly) : undefined 
      }
    });
    res.json({ message: 'User updated successfully', userId: updated.id });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * POST /api/v1/admin/keys
 * Add a new AI provider key
 */
router.post('/keys', async (req, res) => {
  const { provider, apiKey, monthlyBudget } = req.body;
  try {
    const encryptedKey = encrypt(apiKey);
    const newKey = await prisma.apiKey.create({
      data: {
        provider,
        apiKey: encryptedKey,
        monthlyBudget: monthlyBudget || 0,
        updatedById: req.user.id
      }
    });
    res.status(201).json({ message: 'API key added successfully', id: newKey.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

/**
 * GET /api/v1/admin/keys
 * List masked API keys
 */
router.get('/keys', async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany();
    const maskedKeys = keys.map(k => ({
      id: k.id,
      provider: k.provider,
      isActive: k.isActive,
      currentSpend: k.currentSpend,
      monthlyBudget: k.monthlyBudget,
      createdAt: k.createdAt,
      apiKeyMasked: '********' + k.apiKey.slice(-4)
    }));
    res.json(maskedKeys);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch keys' });
  }
});

/**
 * DELETE /api/v1/admin/keys/:id
 */
router.delete('/keys/:id', async (req, res) => {
  try {
    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.json({ message: 'API key removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

const axios = require('axios');
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://palamacloud.duckdns.org';

/**
 * GET /api/v1/admin/summary
 * Returns total counts for dashboard cards including container stats
 */
router.get('/summary', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const keyCount = await prisma.apiKey.count({ where: { isActive: true } });
    const usage = await prisma.usageLog.aggregate({
      _sum: { totalTokens: true }
    });

    // Feedback stats
    const feedbackStats = await prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: true
    });

    // Container stats from Orchestrator
    let containerStats = { activeSessions: 0, maxSessions: 5 };
    try {
      const resp = await axios.get(`${ORCHESTRATOR_URL}/api/health`, { timeout: 3000 });
      containerStats = resp.data;
    } catch (err) {
      console.error('[Admin Summary] Failed to fetch container stats:', err.message);
    }

    res.json({
      totalUsers: userCount,
      activeKeys: keyCount,
      totalTokens: usage._sum.totalTokens || 0,
      totalFeedbacks: feedbackStats._count || 0,
      averageRating: feedbackStats._avg.rating ? Number(feedbackStats._avg.rating.toFixed(1)) : 0,
      successRate: '99.9%',
      activeContainers: containerStats.activeSessions || 0,
      maxContainers: containerStats.maxSessions || 5
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

/**
 * GET /api/v1/admin/analytics
 * Returns usage data grouped by day for the last 30 days
 */
router.get('/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.usageLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalTokens: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const dailyUsage = logs.reduce((acc, log) => {
      const day = log.createdAt.toISOString().split('T')[0];
      if (!acc[day]) acc[day] = 0;
      acc[day] += Number(log.totalTokens);
      return acc;
    }, {});

    const chartData = Object.keys(dailyUsage).map(date => ({
      date,
      tokens: dailyUsage[date]
    }));

    res.json(chartData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/v1/admin/feedbacks
 * Returns a list of all user feedbacks with user info
 */
router.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            email: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(feedbacks);
  } catch (err) {
    console.error('[Admin Feedback Error]:', err);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

/**
 * GET /api/v1/admin/system-stats
 * Proxies system and container stats from Orchestrator
 */
router.get('/system-stats', async (req, res) => {
  try {
    const token = req.headers.authorization; // Use current admin token
    const resp = await axios.get(`${ORCHESTRATOR_URL}/api/admin/system-stats`, {
      headers: { Authorization: token },
      timeout: 10000
    });
    res.json(resp.data);
  } catch (err) {
    console.error('[Admin System Stats] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch system stats from orchestrator' });
  }
});

module.exports = router;
