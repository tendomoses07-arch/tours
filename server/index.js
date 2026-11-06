require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { db, publicUploadDir } = require('./db');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const requestRoutes = require('./routes/requests');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again shortly.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please wait 15 minutes.' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Serve only public media uploads (NEVER sensitive customer passport/visa documents, which are in ./data/uploads and protected by /api/requests/documents/:docId/download)
app.use('/uploads/public', express.static(publicUploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'KOLA TOURS AND TRAVEL API',
    timestamp: new Date().toISOString()
  });
});

// Dynamic SEO Sitemap XML
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const packages = db.prepare('SELECT slug FROM tour_packages WHERE is_archived = 0').all();
  const hotels = db.prepare('SELECT slug FROM hotels WHERE is_active = 1').all();
  const blogs = db.prepare('SELECT slug FROM blog_posts WHERE published = 1').all();

  const staticRoutes = [
    '',
    '/flights',
    '/hotels',
    '/tours',
    '/custom-trip',
    '/visa-passport',
    '/transfers',
    '/about',
    '/contact',
    '/blog',
    '/faq',
    '/privacy-policy',
    '/terms'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const r of staticRoutes) {
    xml += `  <url><loc>${baseUrl}${r}</loc><changefreq>weekly</changefreq><priority>${r === '' ? '1.0' : '0.8'}</priority></url>\n`;
  }
  for (const p of packages) {
    xml += `  <url><loc>${baseUrl}/tours/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
  }
  for (const h of hotels) {
    xml += `  <url><loc>${baseUrl}/hotels/${h.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
  for (const b of blogs) {
    xml += `  <url><loc>${baseUrl}/blog/${b.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
  }
  xml += `</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Serve built React SPA in production / unified mode
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    return res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`  KOLA TOURS AND TRAVEL — Server running on port ${PORT}`);
    console.log(`  API Health: http://localhost:${PORT}/api/health`);
    console.log(`=============================================================`);
  });
}

module.exports = app;

