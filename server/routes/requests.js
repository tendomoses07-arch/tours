const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { db, uploadDir, logAudit } = require('../db');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { sendEmailNotification, createNotification } = require('../mailer');

const router = express.Router();

// Configure secure Multer storage for sensitive visa/passport/travel documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(16).toString('hex');
    cb(null, `doc_${Date.now()}_${safeRandom}${ext}`);
  }
});

const allowedMimes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Only PDF, JPG, PNG, WEBP, or Word documents are allowed.'));
    }
  }
});

function generateReference(serviceType) {
  const prefixMap = {
    flight: 'FLT',
    hotel: 'HTL',
    tour_fixed: 'TUR',
    tour_custom: 'CST',
    visa_passport: 'VSA',
    transfer: 'TRF',
    consultation: 'CNS'
  };
  const code = prefixMap[serviceType] || 'REQ';
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KTT-${code}-${year}-${rand}`;
}

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

// Submit any service booking / inquiry request (supports optional file uploads for Visa/Passport or Custom Trips)
router.post('/', optionalAuth, upload.array('documents', 5), async (req, res) => {
  try {
    const body = req.body;
    const service_type = body.service_type;
    const validTypes = ['flight', 'hotel', 'tour_fixed', 'tour_custom', 'visa_passport', 'transfer', 'consultation'];
    if (!validTypes.includes(service_type)) {
      return res.status(400).json({ error: 'Invalid service type specified.' });
    }

    const customer_name = (req.user ? req.user.full_name : body.customer_name || '').trim();
    const customer_email = (req.user ? req.user.email : body.customer_email || '').trim().toLowerCase();
    const customer_phone = (body.customer_phone || (req.user ? req.user.phone : '') || '').trim();
    const customer_nationality = (body.customer_nationality || (req.user ? req.user.nationality : '') || '').trim();

    if (!customer_name || !customer_email || !customer_phone) {
      return res.status(400).json({ error: 'Customer full name, email address, and phone/WhatsApp number are required.' });
    }

    let detailsObj = {};
    if (typeof body.details === 'string') {
      try {
        detailsObj = JSON.parse(body.details);
      } catch (_) {
        detailsObj = { raw: body.details };
      }
    } else if (typeof body.details === 'object' && body.details !== null) {
      detailsObj = body.details;
    }

    const title = (body.title || `${service_type.toUpperCase()} Request`).trim();
    const related_entity_id = body.related_entity_id ? Number(body.related_entity_id) : null;

    // Ensure unique reference number
    let reference_number = generateReference(service_type);
    while (db.prepare('SELECT id FROM service_requests WHERE reference_number = ?').get(reference_number)) {
      reference_number = generateReference(service_type);
    }

    // Link to user if logged in or if email matches existing account
    let userId = req.user ? req.user.id : null;
    if (!userId) {
      const existingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(customer_email);
      if (existingUser) userId = existingUser.id;
    }

    const insertResult = db.prepare(`
      INSERT INTO service_requests (
        reference_number, user_id, customer_name, customer_email, customer_phone,
        customer_nationality, service_type, title, related_entity_id, details_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `).run(
      reference_number,
      userId,
      customer_name,
      customer_email,
      customer_phone,
      customer_nationality,
      service_type,
      title,
      related_entity_id,
      JSON.stringify(detailsObj)
    );

    const requestId = Number(insertResult.lastInsertRowid);

    // Record any uploaded supporting documents (e.g. Visa/Passport bio page, invitation letters)
    const files = req.files || [];
    const docCategory = body.document_category || 'Supporting Document';
    const insertDoc = db.prepare(`
      INSERT INTO uploaded_documents (
        request_id, user_id, document_category, original_filename, stored_filename, mime_type, file_size, uploaded_by_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const file of files) {
      insertDoc.run(
        requestId,
        userId,
        docCategory,
        file.originalname,
        file.filename,
        file.mimetype,
        file.size,
        req.user && req.user.role === 'admin' ? 'admin' : 'customer'
      );
    }

    // Notify Customer
    if (userId) {
      createNotification({
        userId,
        isAdminTarget: 0,
        title: `Request Submitted (${reference_number})`,
        message: `We have received your request "${title}". Our travel specialists are reviewing it and will prepare your quotation or response shortly.`,
        type: 'status',
        relatedRequestRef: reference_number
      });
    }

    // Notify Admin
    createNotification({
      userId: null,
      isAdminTarget: 1,
      title: `New ${service_type.replace('_', ' ').toUpperCase()} Request: ${reference_number}`,
      message: `${customer_name} (${customer_phone}) submitted "${title}".`,
      type: 'alert',
      relatedRequestRef: reference_number
    });

    await sendEmailNotification({
      to: customer_email,
      subject: `KOLA TOURS AND TRAVEL — Request Received [${reference_number}]`,
      text: `Dear ${customer_name}, thank you for contacting KOLA TOURS AND TRAVEL. Your request "${title}" has been logged with Reference Number ${reference_number}. Status: Submitted.`,
      html: `<p>Dear <strong>${customer_name}</strong>,</p><p>Thank you for choosing <strong>KOLA TOURS AND TRAVEL</strong>. Your request <strong>${title}</strong> has been received.</p><p><strong>Reference Number:</strong> <code>${reference_number}</code><br/><strong>Current Status:</strong> Submitted (Pending Consultant Review)</p>`
    });

    logAudit({
      actorId: userId,
      actorEmail: customer_email,
      actorRole: req.user ? req.user.role : 'guest',
      action: 'SUBMIT_SERVICE_REQUEST',
      targetType: service_type,
      targetRef: reference_number,
      details: title,
      ipAddress: req.ip
    });

    const createdRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(requestId);
    return res.status(201).json({
      message: 'Your request has been submitted successfully!',
      reference_number,
      request: hydrateRequest(createdRow)
    });
  } catch (err) {
    console.error('Submit request error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit travel inquiry.' });
  }
});

// Get logged-in customer's own requests, quotations, notifications, and payments
router.get('/my', requireAuth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM service_requests
      WHERE user_id = ? OR lower(customer_email) = ?
      ORDER BY id DESC
    `).all(req.user.id, req.user.email.toLowerCase());

    const requests = rows.map(hydrateRequest);
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ? AND is_admin_target = 0
      ORDER BY id DESC LIMIT 50
    `).all(req.user.id);

    return res.json({ requests, notifications });
  } catch (err) {
    console.error('Fetch my requests error:', err);
    return res.status(500).json({ error: 'Unable to load your travel requests.' });
  }
});

// Track a request by Reference Number + Email (for quick lookup or newly registered users)
router.get('/track/:reference', optionalAuth, (req, res) => {
  const ref = String(req.params.reference || '').trim().toUpperCase();
  const email = String(req.query.email || (req.user ? req.user.email : '')).trim().toLowerCase();

  const row = db.prepare('SELECT * FROM service_requests WHERE upper(reference_number) = ?').get(ref);
  if (!row) {
    return res.status(404).json({ error: 'No booking or inquiry found with that Reference Number.' });
  }

  const isOwner = (req.user && (req.user.role === 'admin' || req.user.id === row.user_id || req.user.email.toLowerCase() === row.customer_email.toLowerCase())) || (email && email === row.customer_email.toLowerCase());
  if (!isOwner) {
    return res.status(403).json({ error: 'Please provide the email address used when submitting this request, or log in to view full details.' });
  }

  return res.json({ request: hydrateRequest(row) });
});

// Upload additional supporting document to an existing request
router.post('/:id/documents', requireAuth, upload.single('document'), (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Request not found.' });

    if (req.user.role !== 'admin' && row.user_id !== req.user.id && row.customer_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized to upload documents to this request.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a valid document file to upload.' });
    }

    const category = req.body.document_category || 'Supporting Document';
    db.prepare(`
      INSERT INTO uploaded_documents (
        request_id, user_id, document_category, original_filename, stored_filename, mime_type, file_size, uploaded_by_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      row.id,
      req.user.id,
      category,
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      req.user.role
    );

    if (req.user.role !== 'admin' && row.status === 'Awaiting Information') {
      db.prepare("UPDATE service_requests SET status = 'Under Review', updated_at = datetime('now') WHERE id = ?").run(row.id);
    }

    createNotification({
      userId: null,
      isAdminTarget: 1,
      title: `Document Uploaded for ${row.reference_number}`,
      message: `${req.user.full_name} uploaded "${req.file.originalname}" (${category}).`,
      type: 'info',
      relatedRequestRef: row.reference_number
    });

    return res.status(201).json({
      message: 'Document uploaded securely.',
      request: hydrateRequest(db.prepare('SELECT * FROM service_requests WHERE id = ?').get(row.id))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upload document.' });
  }
});

// Secure download of sensitive document ( strictly owner or admin )
router.get('/documents/:docId/download', requireAuth, (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM uploaded_documents WHERE id = ?').get(Number(req.params.docId));
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(doc.request_id);
    const isAllowed = req.user.role === 'admin' || (reqRow && (reqRow.user_id === req.user.id || reqRow.customer_email.toLowerCase() === req.user.email.toLowerCase()));
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied to private travel document.' });
    }

    const filePath = path.join(uploadDir, doc.stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File no longer exists on storage volume.' });
    }

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'DOWNLOAD_PROTECTED_DOCUMENT',
      targetType: 'document',
      targetRef: doc.original_filename,
      details: `Request Ref: ${reqRow ? reqRow.reference_number : doc.request_id}`,
      ipAddress: req.ip
    });

    return res.download(filePath, doc.original_filename);
  } catch (err) {
    return res.status(500).json({ error: 'Unable to download document.' });
  }
});

// Customer accepts or declines a quotation (Step 10 of Workflow)
router.post('/quotations/:quotationId/respond', requireAuth, async (req, res) => {
  try {
    const { decision, notes } = req.body; // 'Accepted' | 'Declined'
    if (!['Accepted', 'Declined'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be Accepted or Declined.' });
    }

    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(Number(req.params.quotationId));
    if (!quotation) return res.status(404).json({ error: 'Quotation not found.' });

    const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(quotation.request_id);
    if (!reqRow) return res.status(404).json({ error: 'Associated booking request not found.' });

    if (req.user.role !== 'admin' && reqRow.user_id !== req.user.id && reqRow.customer_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'You are not authorized to respond to this quotation.' });
    }

    db.prepare(`
      UPDATE quotations
      SET customer_decision = ?, customer_decision_notes = ?, decided_at = datetime('now')
      WHERE id = ?
    `).run(decision, notes ? String(notes).trim() : '', quotation.id);

    const newRequestStatus = decision === 'Accepted' ? 'Payment Pending' : 'Under Review';
    db.prepare(`
      UPDATE service_requests
      SET status = ?, customer_feedback = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newRequestStatus, notes ? String(notes).trim() : `Customer ${decision.toLowerCase()} quotation ${quotation.quotation_number}`, reqRow.id);

    createNotification({
      userId: null,
      isAdminTarget: 1,
      title: `Quotation ${decision}: ${quotation.quotation_number}`,
      message: `${req.user.full_name} ${decision.toLowerCase()} Quotation ${quotation.quotation_number} for ${reqRow.reference_number}.`,
      type: 'quotation',
      relatedRequestRef: reqRow.reference_number
    });

    createNotification({
      userId: req.user.id,
      isAdminTarget: 0,
      title: `You ${decision} Quotation ${quotation.quotation_number}`,
      message: decision === 'Accepted'
        ? `Thank you for accepting Quotation ${quotation.quotation_number}. Your booking status is now "Payment Pending". Please follow the payment instructions or submit your payment reference for verification.`
        : `You declined Quotation ${quotation.quotation_number}. Our team has been notified to revise your proposal.`,
      type: 'status',
      relatedRequestRef: reqRow.reference_number
    });

    return res.json({
      message: decision === 'Accepted'
        ? 'Quotation accepted! Your request is now in Payment Pending status.'
        : 'Quotation response recorded. Our team will review your feedback.',
      request: hydrateRequest(db.prepare('SELECT * FROM service_requests WHERE id = ?').get(reqRow.id))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record quotation decision.' });
  }
});

// Customer submits payment proof / transaction reference for verification (Payment is NOT marked Verified until Admin confirms)
router.post('/:id/payments/submit-proof', requireAuth, (req, res) => {
  try {
    const { amount, currency, payment_method, transaction_reference, payer_name, payer_phone_or_account, notes } = req.body;
    const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(Number(req.params.id));
    if (!reqRow) return res.status(404).json({ error: 'Request not found.' });

    if (req.user.role !== 'admin' && reqRow.user_id !== req.user.id && reqRow.customer_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized.' });
    }
    if (!amount || !payment_method || !transaction_reference) {
      return res.status(400).json({ error: 'Amount, payment method, and transaction reference are required.' });
    }

    const receipt_number = `RCP-KTT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO payments (
        receipt_number, request_id, user_id, amount, currency, payment_method,
        transaction_reference, payer_name, payer_phone_or_account, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Verification', ?)
    `).run(
      receipt_number,
      reqRow.id,
      req.user.id,
      Number(amount),
      currency || 'USD',
      payment_method,
      String(transaction_reference).trim(),
      payer_name || req.user.full_name,
      payer_phone_or_account || req.user.phone || '',
      notes || 'Submitted by customer via dashboard for verification'
    );

    createNotification({
      userId: null,
      isAdminTarget: 1,
      title: `Payment Proof Submitted (${reqRow.reference_number})`,
      message: `${req.user.full_name} submitted ${currency || 'USD'} ${amount} via ${payment_method} (Ref: ${transaction_reference}). Pending administrator verification.`,
      type: 'payment',
      relatedRequestRef: reqRow.reference_number
    });

    return res.status(201).json({
      message: 'Payment reference submitted! It is marked as "Pending Verification" until confirmed by our accounts team.',
      request: hydrateRequest(db.prepare('SELECT * FROM service_requests WHERE id = ?').get(reqRow.id))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit payment proof.' });
  }
});

// Mark customer notification read
router.put('/notifications/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
  return res.json({ message: 'Notification marked as read.' });
});

module.exports = router;

