const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const prisma = new PrismaClient();
const SQLITE_DB = path.join(__dirname, '../../tokens.db');
const USER_ID = '3d196f87-e47f-4935-86d0-d4b512a86546'; // user@test.com

async function migrate() {
    console.log('🚀 Starting migration from SQLite to Neon...');

    const db = new sqlite3.Database(SQLITE_DB, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('❌ Could not connect to SQLite:', err.message);
            process.exit(1);
        }
        console.log('✅ Connected to local tokens.db');
    });

    db.all("SELECT * FROM transactions", async (err, rows) => {
        if (err) {
            console.error('❌ Error reading transactions:', err.message);
            process.exit(1);
        }

        console.log(`📊 Found ${rows.length} transactions to migrate.`);

        let count = 0;
        for (const row of rows) {
            try {
                // Map local transaction to Neon UsageLog
                await prisma.usageLog.create({
                    data: {
                        userId: USER_ID,
                        model: row.category || 'unknown',
                        provider: 'palama_legacy',
                        inputTokens: 0,
                        outputTokens: 0,
                        totalTokens: Math.floor(row.amount) || 0,
                        costUsd: 0,
                        taskType: row.type || 'action',
                        createdAt: new Date(row.timestamp)
                    }
                });
                count++;
            } catch (pErr) {
                console.error(`⚠️ Failed to migrate row ${row.id}:`, pErr.message);
            }
        }

        console.log(`✅ Successfully migrated ${count}/${rows.length} rows.`);
        db.close();
        await prisma.$disconnect();
        console.log('✨ Migration complete!');
        process.exit(0);
    });
}

migrate();
