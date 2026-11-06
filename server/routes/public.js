const express = require('express');
const { db } = require('../db');

const router = express.Router();

function parsePackage(p) {
  if (!p) return null;
  return {
    ...p,
    itinerary: JSON.parse(p.itinerary_json || '[]'),
    activities: JSON.parse(p.activities_json || '[]'),
    included: JSON.parse(p.included_json || '[]'),
    excluded: JSON.parse(p.excluded_json || '[]'),
    gallery: JSON.parse(p.gallery_json || '[]'),
    available_dates: JSON.parse(p.available_dates_json || '[]')
  };
}

function parseHotel(h) {
  if (!h) return null;
  return {
    ...h,
    facilities: JSON.parse(h.facilities_json || '[]'),
    room_types: JSON.parse(h.room_types_json || '[]'),
    images: JSON.parse(h.images_json || '[]')
  };
}

// Get public settings
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return res.json({ settings });
});

// Get destinations
router.get('/destinations', (req, res) => {
  const { region, search, featured } = req.query;
  let sql = 'SELECT * FROM destinations WHERE 1=1';
  const params = [];

  if (region && region !== 'All') {
    sql += ' AND region = ?';
    params.push(region);
  }
  if (featured === 'true') {
    sql += ' AND featured = 1';
  }
  if (search) {
    sql += ' AND (lower(name) LIKE ? OR lower(country) LIKE ? OR lower(tagline) LIKE ?)';
    const term = `%${String(search).toLowerCase()}%`;
    params.push(term, term, term);
  }
  sql += ' ORDER BY featured DESC, id ASC';
  const destinations = db.prepare(sql).all(...params);
  return res.json({ destinations });
});

// Get tour packages
router.get('/packages', (req, res) => {
  const { destination, category, search, featured } = req.query;
  let sql = 'SELECT * FROM tour_packages WHERE is_archived = 0';
  const params = [];

  if (destination && destination !== 'All') {
    sql += ' AND lower(destination) LIKE ?';
    params.push(`%${String(destination).toLowerCase()}%`);
  }
  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (featured === 'true') {
    sql += ' AND featured = 1';
  }
  if (search) {
    sql += ' AND (lower(title) LIKE ? OR lower(destination) LIKE ? OR lower(country) LIKE ? OR lower(description) LIKE ?)';
    const term = `%${String(search).toLowerCase()}%`;
    params.push(term, term, term, term);
  }
  sql += ' ORDER BY featured DESC, id ASC';
  const rows = db.prepare(sql).all(...params);
  return res.json({ packages: rows.map(parsePackage) });
});

// Get single tour package by slug or ID
router.get('/packages/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  let row = db.prepare('SELECT * FROM tour_packages WHERE slug = ? AND is_archived = 0').get(slugOrId);
  if (!row && /^\d+$/.test(slugOrId)) {
    row = db.prepare('SELECT * FROM tour_packages WHERE id = ? AND is_archived = 0').get(Number(slugOrId));
  }
  if (!row) {
    return res.status(404).json({ error: 'Tour package not found.' });
  }
  return res.json({ package: parsePackage(row) });
});

// Get hotels
router.get('/hotels', (req, res) => {
  const { destination, accommodation_type, max_price, search } = req.query;
  let sql = 'SELECT * FROM hotels WHERE is_active = 1';
  const params = [];

  if (destination && destination !== 'All') {
    sql += ' AND (lower(destination) LIKE ? OR lower(country) LIKE ?)';
    const term = `%${String(destination).toLowerCase()}%`;
    params.push(term, term);
  }
  if (accommodation_type && accommodation_type !== 'All') {
    sql += ' AND accommodation_type = ?';
    params.push(accommodation_type);
  }
  if (max_price && !isNaN(Number(max_price))) {
    sql += ' AND indicative_price_usd <= ?';
    params.push(Number(max_price));
  }
  if (search) {
    sql += ' AND (lower(name) LIKE ? OR lower(destination) LIKE ? OR lower(country) LIKE ? OR lower(description) LIKE ?)';
    const term = `%${String(search).toLowerCase()}%`;
    params.push(term, term, term, term);
  }
  sql += ' ORDER BY featured DESC, id ASC';
  const rows = db.prepare(sql).all(...params);
  return res.json({ hotels: rows.map(parseHotel) });
});

// Get single hotel
router.get('/hotels/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  let row = db.prepare('SELECT * FROM hotels WHERE slug = ? AND is_active = 1').get(slugOrId);
  if (!row && /^\d+$/.test(slugOrId)) {
    row = db.prepare('SELECT * FROM hotels WHERE id = ? AND is_active = 1').get(Number(slugOrId));
  }
  if (!row) {
    return res.status(404).json({ error: 'Hotel not found.' });
  }
  return res.json({ hotel: parseHotel(row) });
});

// Get testimonials
router.get('/testimonials', (req, res) => {
  const testimonials = db.prepare('SELECT * FROM testimonials WHERE is_approved = 1 ORDER BY featured DESC, id DESC').all();
  return res.json({ testimonials });
});

// Submit customer review / testimonial
router.post('/testimonials', (req, res) => {
  const { customer_name, customer_role_location, service_used, rating, comment } = req.body;
  if (!customer_name || !comment) {
    return res.status(400).json({ error: 'Your name and review comment are required.' });
  }
  db.prepare(`
    INSERT INTO testimonials (customer_name, customer_role_location, service_used, rating, comment, is_approved, featured)
    VALUES (?, ?, ?, ?, ?, 1, 0)
  `).run(
    String(customer_name).trim(),
    customer_role_location ? String(customer_role_location).trim() : 'Verified Traveler',
    service_used ? String(service_used).trim() : 'General Travel Service',
    Math.min(5, Math.max(1, Number(rating || 5))),
    String(comment).trim()
  );
  return res.status(201).json({ message: 'Thank you! Your travel experience review has been published.' });
});

// Get blog posts
router.get('/blogs', (req, res) => {
  const blogs = db.prepare('SELECT * FROM blog_posts WHERE published = 1 ORDER BY id DESC').all();
  return res.json({ blogs });
});

router.get('/blogs/:slug', (req, res) => {
  const blog = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!blog) return res.status(404).json({ error: 'Article not found.' });
  return res.json({ blog });
});

// Get FAQs
router.get('/faqs', (req, res) => {
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC').all();
  return res.json({ faqs });
});

// Global site search across packages, destinations, hotels, and blog guides
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.json({ destinations: [], packages: [], hotels: [], blogs: [] });
  }
  const term = `%${q}%`;
  const destinations = db.prepare('SELECT * FROM destinations WHERE lower(name) LIKE ? OR lower(country) LIKE ? OR lower(tagline) LIKE ? LIMIT 6').all(term, term, term);
  const packages = db.prepare('SELECT * FROM tour_packages WHERE is_archived = 0 AND (lower(title) LIKE ? OR lower(destination) LIKE ? OR lower(category) LIKE ?) LIMIT 6').all(term, term, term).map(parsePackage);
  const hotels = db.prepare('SELECT * FROM hotels WHERE is_active = 1 AND (lower(name) LIKE ? OR lower(destination) LIKE ? OR lower(country) LIKE ?) LIMIT 6').all(term, term, term).map(parseHotel);
  const blogs = db.prepare('SELECT * FROM blog_posts WHERE published = 1 AND (lower(title) LIKE ? OR lower(excerpt) LIKE ?) LIMIT 4').all(term, term);

  return res.json({ destinations, packages, hotels, blogs });
});

// Newsletter subscription
router.post('/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(cleanEmail);
  return res.status(201).json({ message: 'Subscribed to KOLA TOURS travel inspirations & special fares!' });
});

module.exports = router;

