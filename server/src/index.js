const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: [
        'https://neuradeepai.com',
        'http://localhost:5173', // Vite default dev port
        'http://localhost:5001', // Palama Agent Flask backend
        'http://localhost:3000', // Dev React
        'palama://'  // Desktop app custom protocol
    ],
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
