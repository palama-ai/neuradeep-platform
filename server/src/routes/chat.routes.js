const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();
const CHAT_STORAGE = path.join(__dirname, '../../chat_history.json');

// Helper to load all chats
const loadChats = () => {
  if (fs.existsSync(CHAT_STORAGE)) {
    try {
      return JSON.parse(fs.readFileSync(CHAT_STORAGE, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
};

// Helper to save chats
const saveChats = (chats) => {
  fs.writeFileSync(CHAT_STORAGE, JSON.stringify(chats, null, 2));
};

/**
 * GET /api/v1/chats
 * List all sessions for the user
 */
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const chats = loadChats();
  const userChats = chats[userId] || [];
  
  // Return sessions with basic info (id, title, createdAt)
  const sessions = userChats.map(s => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(sessions);
});

/**
 * POST /api/v1/chats
 * Create a new chat session
 */
router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { title } = req.body;
  const chats = loadChats();
  
  if (!chats[userId]) chats[userId] = [];
  
  const newSession = {
    id: crypto.randomUUID(),
    title: title || "New Chat",
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  chats[userId].push(newSession);
  saveChats(chats);
  
  res.status(201).json(newSession);
});

/**
 * GET /api/v1/chats/:id
 * Get full message history for a session
 */
router.get('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.id;
  const chats = loadChats();
  
  const session = (chats[userId] || []).find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  
  res.json(session);
});

/**
 * POST /api/v1/chats/:id/messages
 * Add a message to a session
 */
router.post('/:id/messages', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.id;
  const { role, content } = req.body;
  
  const chats = loadChats();
  const userSessions = chats[userId] || [];
  const session = userSessions.find(s => s.id === sessionId);
  
  if (!session) return res.status(404).json({ error: "Session not found" });
  
  const newMessage = {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString()
  };
  
  session.messages.push(newMessage);
  
  // Auto-update title if it's the first user message
  if (role === 'user' && (session.title === "New Chat" || session.messages.length === 1)) {
    session.title = content.substring(0, 30) + (content.length > 30 ? "..." : "");
  }
  
  saveChats(chats);
  res.json(newMessage);
});

/**
 * DELETE /api/v1/chats/:id
 * Delete a session
 */
router.delete('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.id;
  const chats = loadChats();
  
  if (chats[userId]) {
    chats[userId] = chats[userId].filter(s => s.id !== sessionId);
    saveChats(chats);
  }
  
  res.json({ success: true });
});

module.exports = router;
