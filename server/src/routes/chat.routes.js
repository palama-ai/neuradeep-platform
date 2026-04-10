const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/chats
 * List all chat sessions for the authenticated user
 */
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(sessions);
  } catch (err) {
    console.error('Chat List Error:', err.message);
    res.status(500).json({ error: 'Failed to list chats' });
  }
});

/**
 * POST /api/v1/chats
 * Create a new chat session
 */
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { title } = req.body;

  try {
    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title || 'New Chat'
      }
    });

    res.status(201).json(session);
  } catch (err) {
    console.error('Chat Create Error:', err.message);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

/**
 * GET /api/v1/chats/:id
 * Get full chat session with all messages
 */
router.get('/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.id;

  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (err) {
    console.error('Chat Get Error:', err.message);
    res.status(500).json({ error: 'Failed to load chat' });
  }
});

/**
 * POST /api/v1/chats/:id/messages
 * Add a message to a chat session
 */
router.post('/:id/messages', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.id;
  const { role, content } = req.body;

  if (!role || !content) {
    return res.status(400).json({ error: 'role and content are required' });
  }

  try {
    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Create message and update session in a transaction
    const [message] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          sessionId,
          role,
          content
        }
      }),
      // Auto-update title if it's the first user message
      ...(role === 'user' && session.title === 'New Chat'
        ? [prisma.chatSession.update({
            where: { id: sessionId },
            data: {
              title: content.substring(0, 30) + (content.length > 30 ? '...' : '')
            }
          })]
        : [prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() }
          })]
      )
    ]);

    res.json(message);
  } catch (err) {
    console.error('Chat Message Error:', err.message);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

/**
 * DELETE /api/v1/chats/:id
 * Delete a chat session and all its messages
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.id;

  try {
    // Verify ownership
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Delete messages first (cascade), then session
    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { sessionId } }),
      prisma.chatSession.delete({ where: { id: sessionId } })
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Chat Delete Error:', err.message);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

module.exports = router;
