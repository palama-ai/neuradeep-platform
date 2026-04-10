const { verifyAccessToken } = require('../utils/auth');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn('[Auth Middleware] No Authorization header provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    console.warn('[Auth Middleware] Token verification failed for token:', token ? (token.substring(0, 10) + '...') : 'none');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = decoded;
  next();
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = { authMiddleware, adminMiddleware };
