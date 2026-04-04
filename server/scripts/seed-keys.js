// f:/palama-persona-v1/neuradeepai-platform/server/scripts/seed-keys.js

const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../src/utils/encryption');
require('dotenv').config();

const prisma = new PrismaClient();

async function seed() {
  console.log('--- Registering Local Keys to Platform (Neon DB) ---');

  // 1. Get OpenRouter key from .env (or hardcoded if you have it)
  const orKey = process.env.OPENROUTER_API_KEY || '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';
  
  if (!orKey) {
    console.error('❌ No OPENROUTER_API_KEY found in .env');
    return;
  }

  // 2. Encrypt it
  const encryptedKey = encrypt(orKey);
  console.log('✅ Key Encrypted successfully.');

  // 3. Upsert into Neon DB
  try {
    const keyDoc = await prisma.apiKey.upsert({
      where: { id: 'default-or-key' }, // Use a stable ID for seeding
      update: {
        apiKey: encryptedKey,
        isActive: true
      },
      create: {
        id: 'default-or-key',
        provider: 'openrouter',
        apiKey: encryptedKey,
        isActive: true
      }
    });

    console.log(`🚀 OpenRouter Key Registered: ${keyDoc.id}`);

    // If Groq is needed for testing vision
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
        const encryptedGroq = encrypt(groqKey);
        await prisma.apiKey.upsert({
            where: { id: 'default-groq-key' },
            create: { id: 'default-groq-key', provider: 'groq', apiKey: encryptedGroq, isActive: true },
            update: { apiKey: encryptedGroq, isActive: true }
        });
        console.log('🚀 Groq Key Registered.');
    }

  } catch (err) {
    console.error('❌ Failed to seed keys:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
