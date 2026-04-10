// f:/palama-persona-v1/neuradeepai-platform/server/prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clear existing data (optional but safe for dev)
  await prisma.usageLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@neuradeepai.com',
      passwordHash: adminPassword,
      fullName: 'Master Admin',
      role: 'admin',
      plan: 'enterprise',
      planCreditsMonthly: 999999,
      credits: 999999,
      creditsTotal: 999999,
    },
  });
  console.log(`✅ Created Admin: ${admin.email}`);

  // 3. Create Regular User
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.create({
    data: {
      email: 'user@test.com',
      passwordHash: userPassword,
      fullName: 'Test User',
      role: 'user',
      plan: 'free',
      planCreditsMonthly: 0,
      credits: 500,
      creditsTotal: 500,
    },
  });
  console.log(`✅ Created User: ${user.email}`);

  // 4. Create dummy API key placeholders
  await prisma.apiKey.createMany({
    data: [
      { provider: 'openrouter', apiKey: 'placeholder_key_encrypt_it_later' },
      { provider: 'groq', apiKey: 'placeholder_key_encrypt_it_later' },
    ]
  });
  console.log('✅ Created dummy API key placeholders');

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
