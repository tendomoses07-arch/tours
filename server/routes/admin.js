const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { db, publicUploadDir, createDatabaseBackup, listDatabaseBackups, logAudit } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendEmailNotification, createNotification } = require('../mailer');

const router = express.Router();

// Protect all admin routes
router.use(requireAdmin);

// Public image upload for banners, tour packages, hotels, destinations
const publicImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, publicUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `media_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});
const uploadPublicMedia = multer({
  storage: publicImageStorage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

router.post('/upload-media', uploadPublicMedia.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
  const imageUrl = `/uploads/public/${req.file.filename}`;
  return res.status(201).json({ imageUrl, filename: req.file.filename });
});

function hydrateRequest(row) {
  if (!row) return null;
  const quotations = db.prepare('SELECT * FROM quotations WHERE request_id = ? ORDER BY id DESC').all(row.id).map((q) => ({
    ...q,
    line_items: JSON.parse(q.line_items_json || '[]'),
    itinerary_proposal: JSON.parse(q.itinerary_proposal_json || '[]')
  }));
  const payments = db.prepare('SELECT * FROM payments WHERE request_id = ? ORDER BY id DESC').all(row.id);
  const documents = db.prepare('SELECT id, request_id, document_category, original_filename, mime_type, file_size, uploaded_by_role, created_at FROM uploaded_documents WHERE request_id = ? ORDER BY id DESC').all(row.id);

  return {
    ...row,
    details: JSON.parse(row.details_json || '{}'),
    quotations,
    payments,
    documents
  };
}

// 1. Dashboard Overview Stats
router.get('/overview', (req, res) => {
  const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
  const totalRequests = db.prepare('SELECT COUNT(*) as c FROM service_requests').get().c;
  const pendingInquiries = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE status IN ('Submitted', 'Under Review', 'Awaiting Information')").get().c;
  const confirmedBookings = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE status IN ('Confirmed', 'Completed')").get().c;
  const totalPackages = db.prepare('SELECT COUNT(*) as c FROM tour_packages WHERE is_archived = 0').get().c;
  const totalFlightInquiries = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE service_type = 'flight'").get().c;
  const totalHotelInquiries = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE service_type = 'hotel'").get().c;
  const totalTourInquiries = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE service_type = 'tour_fixed'").get().c;
  const totalCustomInquiries = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE service_type = 'tour_custom'").get().c;
  const totalVisaRequests = db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE service_type = 'visa_passport'").get().c;
  const totalVerifiedRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Verified' AND currency = 'USD'").get().total;
  const pendingPaymentsCount = db.prepare("SELECT COUNT(*) as c FROM payments WHERE status = 'Pending Verification'").get().c;

  const recentRequests = db.prepare('SELECT * FROM service_requests ORDER BY id DESC LIMIT 10').all().map(hydrateRequest);
  const recentLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 15').all();
  const adminNotifications = db.prepare('SELECT * FROM notifications WHERE is_admin_target = 1 ORDER BY id DESC LIMIT 25').all();

  return res.json({
    stats: {
      totalCustomers,
      totalRequests,
      pendingInquiries,
      confirmedBookings,
      totalPackages,
      totalFlightInquiries,
      totalHotelInquiries,
      totalTourInquiries,
      totalCustomInquiries,
      totalVisaRequests,
      totalVerifiedRevenue,
      pendingPaymentsCount
    },
    recentRequests,
    recentLogs,
    adminNotifications
  });
});

// 2. Customer Management
router.get('/customers', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT id, full_name, email, phone, nationality, passport_number, address, role, email_verified, status, created_at FROM users WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (lower(full_name) LIKE ? OR lower(email) LIKE ? OR lower(phone) LIKE ? OR lower(nationality) LIKE ?)';
    const term = `%${String(search).toLowerCase()}%`;
    params.push(term, term, term, term);
  }
  sql += ' ORDER BY id DESC';
  const customers = db.prepare(sql).all(...params).map((u) => {
    const reqCount = db.prepare('SELECT COUNT(*) as c FROM service_requests WHERE user_id = ? OR lower(customer_email) = ?').get(u.id, u.email.toLowerCase()).c;
    return { ...u, request_count: reqCount };
  });
  return res.json({ customers });
});

router.put('/customers/:id', (req, res) => {
  const { status, role, email_verified, full_name, phone, nationality } = req.body;
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!target) return res.status(404).json({ error: 'User not found.' });

  db.prepare(`
    UPDATE users
    SET status = COALESCE(?, status),
        role = COALESCE(?, role),
        email_verified = COALESCE(?, email_verified),
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        nationality = COALESCE(?, nationality),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    status || null,
    role || null,
    email_verified !== undefined ? Number(email_verified) : null,
    full_name || null,
    phone || null,
    nationality || null,
    target.id
  );

  logAudit({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: 'admin',
    action: 'UPDATE_CUSTOMER_ACCOUNT',
    targetType: 'user',
    targetRef: target.email,
    details: JSON.stringify({ status, role, email_verified }),
    ipAddress: req.ip
  });

  return res.json({ message: 'Customer account updated.' });
});

// 3. All Service Requests Management (Flights, Hotels, Fixed Tours, Custom Itineraries, Visa & Passport, Transfers)
router.get('/requests', (req, res) => {
  const { service_type, status, search } = req.query;
  let sql = 'SELECT * FROM service_requests WHERE 1=1';
  const params = [];

  if (service_type && service_type !== 'All') {
    sql += ' AND service_type = ?';
    params.push(service_type);
  }
  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (lower(reference_number) LIKE ? OR lower(customer_name) LIKE ? OR lower(customer_email) LIKE ? OR lower(title) LIKE ?)';
    const term = `%${String(search).toLowerCase()}%`;
    params.push(term, term, term, term);
  }
  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...params);
  return res.json({ requests: rows.map(hydrateRequest) });
});

// Update Request Status, Admin Notes & Customer Response
router.put('/requests/:id', async (req, res) => {
  try {
    const { status, admin_notes, admin_response, total_quoted_amount } = req.body;
    const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(Number(req.params.id));
    if (!reqRow) return res.status(404).json({ error: 'Service request not found.' });

    const validStatuses = [
      'Submitted',
      'Under Review',
      'Awaiting Information',
      'Quotation Sent',
      'Awaiting Customer Approval',
      'Payment Pending',
      'Confirmed',
      'Completed',
      'Cancelled'
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    db.prepare(`
      UPDATE service_requests
      SET status = COALESCE(?, status),
          admin_notes = COALESCE(?, admin_notes),
          admin_response = COALESCE(?, admin_response),
          total_quoted_amount = COALESCE(?, total_quoted_amount),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      status || null,
      admin_notes !== undefined ? admin_notes : null,
      admin_response !== undefined ? admin_response : null,
      total_quoted_amount !== undefined ? Number(total_quoted_amount) : null,
      reqRow.id
    );

    const updated = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(reqRow.id);

    if (updated.user_id) {
      createNotification({
        userId: updated.user_id,
        isAdminTarget: 0,
        title: `Update on ${updated.reference_number}: ${updated.status}`,
        message: admin_response ? `${admin_response}` : `Your request "${updated.title}" status is now "${updated.status}".`,
        type: 'status',
        relatedRequestRef: updated.reference_number
      });
    }

    await sendEmailNotification({
      to: updated.customer_email,
      subject: `KOLA TOURS AND TRAVEL — Update on ${updated.reference_number} [${updated.status}]`,
      text: `Dear ${updated.customer_name}, your request ${updated.reference_number} (${updated.title}) has been updated to status: ${updated.status}.\n\nConsultant Response:\n${updated.admin_response || 'Please log in to your dashboard for details.'}`,
      html: `<p>Dear <strong>${updated.customer_name}</strong>,</p><p>Your travel request <strong>${updated.reference_number}</strong> (${updated.title}) status is now: <strong>${updated.status}</strong>.</p>${updated.admin_response ? `<p><strong>Message from KOLA TOURS Consultant:</strong><br/>${updated.admin_response}</p>` : ''}`
    });

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'UPDATE_SERVICE_REQUEST',
      targetType: updated.service_type,
      targetRef: updated.reference_number,
      details: `Status -> ${updated.status}`,
      ipAddress: req.ip
    });

    return res.json({
      message: 'Request updated and customer notified.',
      request: hydrateRequest(updated)
    });
  } catch (err) {
    console.error('Update request error:', err);
    return res.status(500).json({ error: 'Failed to update request.' });
  }
});

// Create & Send Official Quotation / Custom Itinerary Proposal for a Request
router.post('/requests/:id/quotations', async (req, res) => {
  try {
    const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(Number(req.params.id));
    if (!reqRow) return res.status(404).json({ error: 'Request not found.' });

    const {
      title,
      summary,
      line_items,
      itinerary_proposal,
      taxes_fees = 0,
      currency = 'USD',
      valid_until,
      payment_instructions,
      terms_notes
    } = req.body;

    if (!title || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'Quotation title and at least one line item are required.' });
    }

    const normalizedItems = line_items.map((item) => {
      const qty = Number(item.quantity || 1);
      const unit = Number(item.unit_price || 0);
      return {
        description: String(item.description || 'Travel Service Item'),
        quantity: qty,
        unit_price: unit,
        total: qty * unit
      };
    });

    const subtotal = normalizedItems.reduce((acc, i) => acc + i.total, 0);
    const taxes = Number(taxes_fees || 0);
    const total_amount = subtotal + taxes;
    const quotation_number = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    db.prepare(`
      INSERT INTO quotations (
        quotation_number, request_id, user_id, title, summary, line_items_json,
        itinerary_proposal_json, subtotal, taxes_fees, total_amount, currency,
        valid_until, payment_instructions, terms_notes, customer_decision, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `).run(
      quotation_number,
      reqRow.id,
      reqRow.user_id,
      title,
      summary || '',
      JSON.stringify(normalizedItems),
      JSON.stringify(Array.isArray(itinerary_proposal) ? itinerary_proposal : []),
      subtotal,
      taxes,
      total_amount,
      currency,
      valid_until || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      payment_instructions || 'Pay via MTN Mobile Money, Airtel Money, Bank Transfer, or Visa/Mastercard quoting your Reference Number.',
      terms_notes || 'Subject to availability at the time of confirmation.',
      req.user.id
    );

    db.prepare(`
      UPDATE service_requests
      SET status = 'Quotation Sent',
          total_quoted_amount = ?,
          currency = ?,
          admin_response = COALESCE(NULLIF(?, ''), admin_response),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      total_amount,
      currency,
      `Official Quotation ${quotation_number} (${currency} ${total_amount.toLocaleString()}) has been prepared for your review and approval.`,
      reqRow.id
    );

    if (reqRow.user_id) {
      createNotification({
        userId: reqRow.user_id,
        isAdminTarget: 0,
        title: `New Quotation Available: ${quotation_number}`,
        message: `KOLA TOURS prepared Quotation ${quotation_number} (${currency} ${total_amount.toLocaleString()}) for "${reqRow.title}". Please review and accept or decline in your dashboard.`,
        type: 'quotation',
        relatedRequestRef: reqRow.reference_number
      });
    }

    await sendEmailNotification({
      to: reqRow.customer_email,
      subject: `KOLA TOURS AND TRAVEL — Quotation ${quotation_number} for ${reqRow.reference_number}`,
      text: `Dear ${reqRow.customer_name}, we have prepared Quotation ${quotation_number} totaling ${currency} ${total_amount.toLocaleString()} for "${title}". Please log in to your Customer Dashboard to review the itemized breakdown and accept or decline.`,
      html: `<p>Dear <strong>${reqRow.customer_name}</strong>,</p><p>Your official travel quotation <strong>${quotation_number}</strong> for <strong>${title}</strong> is ready.</p><p><strong>Total Amount:</strong> ${currency} ${total_amount.toLocaleString()}</p><p>Please log in to your KOLA TOURS Customer Dashboard to view the full itinerary/fare breakdown and approve the quotation.</p>`
    });

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'CREATE_QUOTATION',
      targetType: 'quotation',
      targetRef: quotation_number,
      details: `Request ${reqRow.reference_number} | Total ${currency} ${total_amount}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: `Quotation ${quotation_number} created and sent to customer!`,
      request: hydrateRequest(db.prepare('SELECT * FROM service_requests WHERE id = ?').get(reqRow.id))
    });
  } catch (err) {
    console.error('Create quotation error:', err);
    return res.status(500).json({ error: 'Failed to create quotation.' });
  }
});

// 4. Payments Management (Record manual payment or verify customer-submitted payment)
router.get('/payments', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, r.reference_number, r.title as request_title, r.customer_name, r.customer_email, r.total_quoted_amount
    FROM payments p
    JOIN service_requests r ON p.request_id = r.id
    ORDER BY p.id DESC
  `).all();
  return res.json({ payments: rows });
});

router.post('/payments', async (req, res) => {
  try {
    const {
      request_id,
      amount,
      currency = 'USD',
      payment_method,
      transaction_reference,
      payer_name,
      payer_phone_or_account,
      status = 'Verified',
      notes,
      auto_confirm_booking = true
    } = req.body;

    const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(Number(request_id));
    if (!reqRow) return res.status(404).json({ error: 'Associated booking request not found.' });

    const receipt_number = `RCP-KTT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO payments (
        receipt_number, request_id, user_id, amount, currency, payment_method,
        transaction_reference, payer_name, payer_phone_or_account, status, verified_by, verified_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'Verified' THEN datetime('now') ELSE NULL END, ?)
    `).run(
      receipt_number,
      reqRow.id,
      reqRow.user_id,
      Number(amount),
      currency,
      payment_method,
      transaction_reference,
      payer_name || reqRow.customer_name,
      payer_phone_or_account || reqRow.customer_phone,
      status,
      req.user.id,
      status,
      notes || ''
    );

    // Recalculate total verified payments on this request
    const sumVerified = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE request_id = ? AND status = 'Verified'").get(reqRow.id).s;
    const nextStatus = status === 'Verified' && auto_confirm_booking ? 'Confirmed' : reqRow.status;

    db.prepare(`
      UPDATE service_requests
      SET total_paid_amount = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(sumVerified, nextStatus, reqRow.id);

    if (reqRow.user_id) {
      createNotification({
        userId: reqRow.user_id,
        isAdminTarget: 0,
        title: `Payment Recorded & Receipt ${receipt_number}`,
        message: `A payment of ${currency} ${Number(amount).toLocaleString()} (${payment_method}) for ${reqRow.reference_number} has been marked "${status}". Booking Status: ${nextStatus}.`,
        type: 'payment',
        relatedRequestRef: reqRow.reference_number
      });
    }

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'RECORD_PAYMENT',
      targetType: 'payment',
      targetRef: receipt_number,
      details: `${currency} ${amount} via ${payment_method} (${status}) for ${reqRow.reference_number}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: `Payment recorded and Receipt ${receipt_number} generated.`,
      receipt_number
    });
  } catch (err) {
    console.error('Record payment error:', err);
    return res.status(500).json({ error: 'Failed to record payment.' });
  }
});

router.put('/payments/:id/verify', (req, res) => {
  try {
    const { status, notes, confirm_booking } = req.body; // 'Verified' | 'Rejected'
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(Number(req.params.id));
    if (!payment) return res.status(404).json({ error: 'Payment record not found.' });

    db.prepare(`
      UPDATE payments
      SET status = ?, notes = COALESCE(?, notes), verified_by = ?, verified_at = datetime('now')
      WHERE id = ?
    `).run(status, notes || null, req.user.id, payment.id);

    const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(payment.request_id);
    const sumVerified = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE request_id = ? AND status = 'Verified'").get(payment.request_id).s;
    const newReqStatus = status === 'Verified' && confirm_booking ? 'Confirmed' : reqRow.status;

    db.prepare("UPDATE service_requests SET total_paid_amount = ?, status = ?, updated_at = datetime('now') WHERE id = ?").run(sumVerified, newReqStatus, payment.request_id);

    if (reqRow && reqRow.user_id) {
      createNotification({
        userId: reqRow.user_id,
        isAdminTarget: 0,
        title: `Payment ${status}: ${payment.receipt_number}`,
        message: `Your payment of ${payment.currency} ${payment.amount} for ${reqRow.reference_number} was marked ${status}.`,
        type: 'payment',
        relatedRequestRef: reqRow.reference_number
      });
    }

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'VERIFY_PAYMENT',
      targetType: 'payment',
      targetRef: payment.receipt_number,
      details: `Marked ${status}`,
      ipAddress: req.ip
    });

    return res.json({ message: `Payment ${payment.receipt_number} updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// 5. Tour Packages Management (CRUD)
router.post('/packages', (req, res) => {
  try {
    const p = req.body;
    if (!p.title || !p.destination || !p.price_per_person) {
      return res.status(400).json({ error: 'Package title, destination, and price per person are required.' });
    }
    const slug = (p.slug || p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    db.prepare(`
      INSERT INTO tour_packages (
        title, slug, destination, country, category, duration_days, duration_label,
        price_per_person, min_participants, max_participants, description,
        itinerary_json, accommodation_details, transportation_details,
        activities_json, included_json, excluded_json, gallery_json,
        available_dates_json, hero_image, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.title,
      slug,
      p.destination,
      p.country || p.destination,
      p.category || 'Safari & Wildlife',
      Number(p.duration_days || 5),
      p.duration_label || `${p.duration_days || 5} Days`,
      Number(p.price_per_person),
      Number(p.min_participants || 2),
      Number(p.max_participants || 16),
      p.description || '',
      JSON.stringify(Array.isArray(p.itinerary) ? p.itinerary : []),
      p.accommodation_details || '4-Star / 5-Star Partner Hotel or Safari Lodge',
      p.transportation_details || 'Private air-conditioned touring vehicle & airport transfers',
      JSON.stringify(Array.isArray(p.activities) ? p.activities : []),
      JSON.stringify(Array.isArray(p.included) ? p.included : []),
      JSON.stringify(Array.isArray(p.excluded) ? p.excluded : []),
      JSON.stringify(Array.isArray(p.gallery) ? p.gallery : [p.hero_image]),
      JSON.stringify(Array.isArray(p.available_dates) ? p.available_dates : ['Available Year-Round on Request']),
      p.hero_image || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
      p.featured !== undefined ? Number(Boolean(p.featured)) : 1
    );

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'CREATE_TOUR_PACKAGE',
      targetType: 'tour_package',
      targetRef: slug,
      details: p.title,
      ipAddress: req.ip
    });

    return res.status(201).json({ message: 'Tour package created successfully.' });
  } catch (err) {
    console.error('Create package error:', err);
    return res.status(500).json({ error: 'Failed to create tour package.' });
  }
});

router.put('/packages/:id', (req, res) => {
  try {
    const p = req.body;
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM tour_packages WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Package not found.' });

    db.prepare(`
      UPDATE tour_packages
      SET title = ?, destination = ?, country = ?, category = ?,
          duration_days = ?, duration_label = ?, price_per_person = ?,
          min_participants = ?, max_participants = ?, description = ?,
          itinerary_json = ?, accommodation_details = ?, transportation_details = ?,
          activities_json = ?, included_json = ?, excluded_json = ?,
          gallery_json = ?, available_dates_json = ?, hero_image = ?,
          featured = ?, is_archived = ?
      WHERE id = ?
    `).run(
      p.title || existing.title,
      p.destination || existing.destination,
      p.country || existing.country,
      p.category || existing.category,
      Number(p.duration_days || existing.duration_days),
      p.duration_label || existing.duration_label,
      Number(p.price_per_person !== undefined ? p.price_per_person : existing.price_per_person),
      Number(p.min_participants || existing.min_participants),
      Number(p.max_participants || existing.max_participants),
      p.description !== undefined ? p.description : existing.description,
      p.itinerary ? JSON.stringify(p.itinerary) : existing.itinerary_json,
      p.accommodation_details || existing.accommodation_details,
      p.transportation_details || existing.transportation_details,
      p.activities ? JSON.stringify(p.activities) : existing.activities_json,
      p.included ? JSON.stringify(p.included) : existing.included_json,
      p.excluded ? JSON.stringify(p.excluded) : existing.excluded_json,
      p.gallery ? JSON.stringify(p.gallery) : existing.gallery_json,
      p.available_dates ? JSON.stringify(p.available_dates) : existing.available_dates_json,
      p.hero_image || existing.hero_image,
      p.featured !== undefined ? Number(Boolean(p.featured)) : existing.featured,
      p.is_archived !== undefined ? Number(Boolean(p.is_archived)) : existing.is_archived,
      id
    );

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: 'admin',
      action: 'UPDATE_TOUR_PACKAGE',
      targetType: 'tour_package',
      targetRef: String(id),
      details: p.title || existing.title,
      ipAddress: req.ip
    });

    return res.json({ message: 'Tour package updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update tour package.' });
  }
});

router.delete('/packages/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE tour_packages SET is_archived = 1 WHERE id = ?').run(id);
  logAudit({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: 'admin',
    action: 'ARCHIVE_TOUR_PACKAGE',
    targetType: 'tour_package',
    targetRef: String(id),
    details: 'Archived package',
    ipAddress: req.ip
  });
  return res.json({ message: 'Tour package archived.' });
});

// 6. Destinations Management (CRUD)
router.post('/destinations', (req, res) => {
  const d = req.body;
  if (!d.name || !d.country || !d.tagline) {
    return res.status(400).json({ error: 'Name, country, and tagline are required.' });
  }
  const slug = (d.name + '-' + d.country).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(10 + Math.random() * 89);
  db.prepare(`
    INSERT INTO destinations (name, slug, country, region, is_local, tagline, description, image_url, best_time, starting_from_usd, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    d.name,
    slug,
    d.country,
    d.region || 'East Africa',
    d.is_local ? 1 : 0,
    d.tagline,
    d.description || d.tagline,
    d.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    d.best_time || 'Year-round',
    Number(d.starting_from_usd || 500),
    d.featured !== undefined ? (d.featured ? 1 : 0) : 1
  );
  return res.status(201).json({ message: 'Destination added.' });
});

router.put('/destinations/:id', (req, res) => {
  const d = req.body;
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM destinations WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Destination not found.' });

  db.prepare(`
    UPDATE destinations
    SET name = ?, country = ?, region = ?, is_local = ?, tagline = ?, description = ?, image_url = ?, best_time = ?, starting_from_usd = ?, featured = ?
    WHERE id = ?
  `).run(
    d.name || existing.name,
    d.country || existing.country,
    d.region || existing.region,
    d.is_local !== undefined ? (d.is_local ? 1 : 0) : existing.is_local,
    d.tagline || existing.tagline,
    d.description || existing.description,
    d.image_url || existing.image_url,
    d.best_time || existing.best_time,
    Number(d.starting_from_usd !== undefined ? d.starting_from_usd : existing.starting_from_usd),
    d.featured !== undefined ? (d.featured ? 1 : 0) : existing.featured,
    id
  );
  return res.json({ message: 'Destination updated.' });
});

router.delete('/destinations/:id', (req, res) => {
  db.prepare('DELETE FROM destinations WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Destination removed.' });
});

// 7. Hotels Management (CRUD)
router.post('/hotels', (req, res) => {
  const h = req.body;
  if (!h.name || !h.destination || !h.indicative_price_usd) {
    return res.status(400).json({ error: 'Hotel name, destination, and indicative price are required.' });
  }
  const slug = h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 899);
  db.prepare(`
    INSERT INTO hotels (
      name, slug, destination, country, address, star_rating, accommodation_type,
      description, facilities_json, room_types_json, indicative_price_usd,
      images_json, hero_image, featured, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    h.name,
    slug,
    h.destination,
    h.country || h.destination,
    h.address || h.destination,
    Number(h.star_rating || 5),
    h.accommodation_type || 'Luxury Hotel',
    h.description || '',
    JSON.stringify(Array.isArray(h.facilities) ? h.facilities : ['Free Wi-Fi', 'Swimming Pool', 'Restaurant', 'Airport Shuttle']),
    JSON.stringify(Array.isArray(h.room_types) ? h.room_types : [{ name: 'Deluxe Room', capacity: '2 Adults', price_per_night: Number(h.indicative_price_usd), perks: 'Breakfast Included' }]),
    Number(h.indicative_price_usd),
    JSON.stringify(Array.isArray(h.images) ? h.images : [h.hero_image]),
    h.hero_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
    h.featured !== undefined ? (h.featured ? 1 : 0) : 1
  );

  logAudit({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: 'admin',
    action: 'CREATE_HOTEL',
    targetType: 'hotel',
    targetRef: slug,
    details: h.name,
    ipAddress: req.ip
  });

  return res.status(201).json({ message: 'Hotel listing created.' });
});

router.put('/hotels/:id', (req, res) => {
  const h = req.body;
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM hotels WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Hotel not found.' });

  db.prepare(`
    UPDATE hotels
    SET name = ?, destination = ?, country = ?, address = ?, star_rating = ?,
        accommodation_type = ?, description = ?, facilities_json = ?, room_types_json = ?,
        indicative_price_usd = ?, hero_image = ?, featured = ?, is_active = ?
    WHERE id = ?
  `).run(
    h.name || existing.name,
    h.destination || existing.destination,
    h.country || existing.country,
    h.address || existing.address,
    Number(h.star_rating || existing.star_rating),
    h.accommodation_type || existing.accommodation_type,
    h.description !== undefined ? h.description : existing.description,
    h.facilities ? JSON.stringify(h.facilities) : existing.facilities_json,
    h.room_types ? JSON.stringify(h.room_types) : existing.room_types_json,
    Number(h.indicative_price_usd !== undefined ? h.indicative_price_usd : existing.indicative_price_usd),
    h.hero_image || existing.hero_image,
    h.featured !== undefined ? (h.featured ? 1 : 0) : existing.featured,
    h.is_active !== undefined ? (h.is_active ? 1 : 0) : existing.is_active,
    id
  );
  return res.json({ message: 'Hotel updated.' });
});

router.delete('/hotels/:id', (req, res) => {
  db.prepare('UPDATE hotels SET is_active = 0 WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Hotel listing removed.' });
});

// 8. Website Content & Testimonials & Blog & FAQ Management
router.get('/testimonials', (req, res) => {
  const testimonials = db.prepare('SELECT * FROM testimonials ORDER BY id DESC').all();
  return res.json({ testimonials });
});

router.post('/testimonials', (req, res) => {
  const { customer_name, customer_role_location, service_used, rating, comment, is_approved = 1, featured = 1 } = req.body;
  if (!customer_name || !comment) {
    return res.status(400).json({ error: 'Customer name and review comment are required.' });
  }
  db.prepare(`
    INSERT INTO testimonials (customer_name, customer_role_location, service_used, rating, comment, is_approved, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(customer_name).trim(),
    customer_role_location ? String(customer_role_location).trim() : 'Verified Client',
    service_used ? String(service_used).trim() : 'Travel & Tour Package',
    Math.min(5, Math.max(1, Number(rating || 5))),
    String(comment).trim(),
    is_approved ? 1 : 0,
    featured ? 1 : 0
  );
  return res.status(201).json({ message: 'Testimonial created and published.' });
});

router.put('/testimonials/:id', (req, res) => {
  const { is_approved, featured, comment, customer_name, customer_role_location, service_used, rating } = req.body;
  db.prepare(`
    UPDATE testimonials
    SET is_approved = COALESCE(?, is_approved),
        featured = COALESCE(?, featured),
        comment = COALESCE(?, comment),
        customer_name = COALESCE(?, customer_name),
        customer_role_location = COALESCE(?, customer_role_location),
        service_used = COALESCE(?, service_used),
        rating = COALESCE(?, rating)
    WHERE id = ?
  `).run(
    is_approved !== undefined ? (is_approved ? 1 : 0) : null,
    featured !== undefined ? (featured ? 1 : 0) : null,
    comment || null,
    customer_name || null,
    customer_role_location || null,
    service_used || null,
    rating ? Number(rating) : null,
    Number(req.params.id)
  );
  return res.json({ message: 'Testimonial updated.' });
});

router.delete('/testimonials/:id', (req, res) => {
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Testimonial deleted.' });
});

router.get('/blogs', (req, res) => {
  const blogs = db.prepare('SELECT * FROM blog_posts ORDER BY id DESC').all();
  return res.json({ blogs });
});

router.post('/blogs', (req, res) => {
  const { title, category, excerpt, content, cover_image, read_time } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(10 + Math.random() * 89);
  db.prepare(`
    INSERT INTO blog_posts (title, slug, category, excerpt, content, cover_image, read_time, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    title,
    slug,
    category || 'Travel Guide',
    excerpt || content.slice(0, 140),
    content,
    cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    read_time || '5 min read'
  );
  return res.status(201).json({ message: 'Blog article published.' });
});

router.put('/blogs/:id', (req, res) => {
  const { title, category, excerpt, content, cover_image, read_time, published } = req.body;
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Blog post not found.' });

  db.prepare(`
    UPDATE blog_posts
    SET title = ?, category = ?, excerpt = ?, content = ?, cover_image = ?, read_time = ?, published = ?
    WHERE id = ?
  `).run(
    title || existing.title,
    category || existing.category,
    excerpt !== undefined ? excerpt : existing.excerpt,
    content || existing.content,
    cover_image || existing.cover_image,
    read_time || existing.read_time,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    id
  );
  return res.json({ message: 'Blog article updated.' });
});

router.delete('/blogs/:id', (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'Blog article deleted.' });
});

router.get('/faqs', (req, res) => {
  const faqs = db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC').all();
  return res.json({ faqs });
});

router.post('/faqs', (req, res) => {
  const { category, question, answer, sort_order } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required.' });
  db.prepare(`
    INSERT INTO faqs (category, question, answer, sort_order)
    VALUES (?, ?, ?, ?)
  `).run(category || 'General', question, answer, Number(sort_order || 1));
  return res.status(201).json({ message: 'FAQ item added.' });
});

router.put('/faqs/:id', (req, res) => {
  const { category, question, answer, sort_order } = req.body;
  db.prepare(`
    UPDATE faqs
    SET category = COALESCE(?, category),
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(category || null, question || null, answer || null, sort_order !== undefined ? Number(sort_order) : null, Number(req.params.id));
  return res.json({ message: 'FAQ updated.' });
});

router.delete('/faqs/:id', (req, res) => {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(Number(req.params.id));
  return res.json({ message: 'FAQ item deleted.' });
});

// 9. System Settings Management (WhatsApp number, company contact, currency, banners, payment instructions)
router.put('/settings', (req, res) => {
  const updates = req.body.settings || req.body;
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  for (const [k, v] of Object.entries(updates)) {
    if (typeof v === 'string' || typeof v === 'number') {
      upsert.run(k, String(v));
    }
  }

  logAudit({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: 'admin',
    action: 'UPDATE_SYSTEM_SETTINGS',
    targetType: 'settings',
    targetRef: 'global',
    details: `Updated keys: ${Object.keys(updates).join(', ')}`,
    ipAddress: req.ip
  });

  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;

  return res.json({ message: 'System settings saved successfully.', settings });
});

// 10. Database Backups & Audit Logs
router.get('/backups', (req, res) => {
  return res.json({ backups: listDatabaseBackups(), logs: db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all() });
});

router.post('/backups', (req, res) => {
  const backup = createDatabaseBackup('admin_snapshot');
  logAudit({
    actorId: req.user.id,
    actorEmail: req.user.email,
    actorRole: 'admin',
    action: 'CREATE_DATABASE_BACKUP',
    targetType: 'database',
    targetRef: backup.filename,
    details: `Size: ${backup.sizeBytes} bytes`,
    ipAddress: req.ip
  });
  return res.status(201).json({ message: 'Database snapshot backup created.', backup });
});

module.exports = router;

