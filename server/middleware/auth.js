const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'kola-tours-secret-key-change-in-production-2026';

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, full_name, email, phone, nationality, passport_number, address, role, email_verified, status FROM users WHERE id = ?').get(decoded.id);
      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (_) {
      // Ignore invalid optional token
    }
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, full_name, email, phone, nationality, passport_number, address, role, email_verified, status, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact KOLA TOURS support.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator privileges required to access this resource.' });
    }
    next();
  });
}

module.exports = {
  signToken,
  optionalAuth,
  requireAuth,
  requireAdmin
};
