const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'https://neuradeepai.com',
            'https://neuradeep-platform3.vercel.app',
            'http://localhost:5173',
            'http://localhost:5001',
            'http://localhost:3000',
            'palama://'
        ];
        
        // Allow dynamic cloud IPs or custom domains (e.g. any port on localhost or specific cloud IP)
        // In production, we should tighten this, but for Oracle Cloud dynamic ports we allow based on ENV
        const extraOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
        if (allowedOrigins.includes(origin) || extraOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Also allow dynamic ports on localhost for dev/testing cloud locally
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
             return callback(null, true);
        }

        // For Oracle Cloud / Dynamic Domains
        console.log(`[CORS Check] Origin: ${origin}`);
        if (origin.includes('84.8.219.101') || origin.includes('duckdns.org')) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// ─── Health Check ───
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date() });
});

// ─── API Routes ───
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/chat', require('./routes/proxy.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/config', require('./routes/config.routes'));
app.use('/api/v1/admin/config', require('./routes/config.routes'));
app.use('/api/v1/chats', require('./routes/chat.routes'));
app.use('/api/v1/credits', require('./routes/credit.routes'));
app.use('/api/v1/referral', require('./routes/referral.routes'));
app.use('/api/v1/feedback', require('./routes/feedback.routes'));

// ─── Serve React SPA ───
const clientPath = path.join(__dirname, '../../client/dist');
const indexPath = path.join(clientPath, 'index.html');

app.use(express.static(clientPath));

// Catch-all: Send any non-API request to React index.html
app.get(/^\/(?!api).*/, (req, res) => {
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).json({ 
            message: "NeuraDeepAI API is active. Frontend (dist) not detected.",
            instruction: "Run 'npm run build:client' to enable the dashboard UI here."
        });
    }
});

// ─── Start Server ───
// Only listen if not running in a Vercel Serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
    app.listen(PORT, () => {
        console.log(`🚀 NeuraDeepAI Server running on port ${PORT}`);
        console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
    });
}

// Export for Vercel
module.exports = app;
