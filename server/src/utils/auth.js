const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const generateAccessToken = user => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
const verifyAccessToken = token => { try { return jwt.verify(token, JWT_SECRET); } catch { return null; } };
module.exports = { generateAccessToken, verifyAccessToken };
