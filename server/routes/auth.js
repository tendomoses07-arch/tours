const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db, logAudit } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');
const { sendEmailNotification, createNotification } = require('../mailer');

const router = express.Router();

// Register a new customer account
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, nationality, password } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email address, and password are required.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const result = db.prepare(`
      INSERT INTO users (full_name, email, phone, nationality, password_hash, role, email_verified, verification_token)
      VALUES (?, ?, ?, ?, ?, 'customer', 0, ?)
    `).run(
      String(full_name).trim(),
      cleanEmail,
      phone ? String(phone).trim() : '',
      nationality ? String(nationality).trim() : '',
      passwordHash,
      verificationToken
    );

    const userId = Number(result.lastInsertRowid);
    // Automatically link any past guest service requests submitted with this email
    db.prepare('UPDATE service_requests SET user_id = ? WHERE lower(customer_email) = ? AND user_id IS NULL').run(userId, cleanEmail);
    db.prepare('UPDATE quotations SET user_id = ? WHERE request_id IN (SELECT id FROM service_requests WHERE user_id = ?)').run(userId, userId);

    const user = db.prepare('SELECT id, full_name, email, phone, nationality, passport_number, address, role, email_verified, created_at FROM users WHERE id = ?').get(userId);
    const token = signToken(user);

    createNotification({
      userId,
      isAdminTarget: 0,
      title: 'Welcome to KOLA TOURS AND TRAVEL!',
      message: `Hello ${user.full_name}, your customer account is active. You can submit and track flight, hotel, safari, and visa requests anytime. Verification Code: ${verificationToken.slice(0, 8).toUpperCase()}`,
      type: 'info'
    });

    createNotification({
      userId: null,
      isAdminTarget: 1,
      title: 'New Customer Registered',
      message: `${user.full_name} (${user.email}) registered a customer account.`,
      type: 'info'
    });

    await sendEmailNotification({
      to: user.email,
      subject: 'Welcome to KOLA TOURS AND TRAVEL — Verify Your Email',
      text: `Welcome ${user.full_name}! Your verification code is ${verificationToken.slice(0, 8).toUpperCase()}.`,
      html: `<p>Welcome <strong>${user.full_name}</strong> to KOLA TOURS AND TRAVEL!</p><p>Your verification token is: <code>${verificationToken.slice(0, 8).toUpperCase()}</code></p>`
    });

    logAudit({
      actorId: userId,
      actorEmail: user.email,
      actorRole: 'customer',
      action: 'REGISTER_ACCOUNT',
      targetType: 'user',
      targetRef: String(userId),
      details: 'Customer registered account',
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user,
      verification_hint: verificationToken.slice(0, 8).toUpperCase()
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Unable to complete registration.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const userRow = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(cleanEmail);
    if (!userRow || !bcrypt.compareSync(password, userRow.password_hash)) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }
    if (userRow.status !== 'active') {
      return res.status(403).json({ error: 'This account is currently suspended. Please contact support.' });
    }

    const user = {
      id: userRow.id,
      full_name: userRow.full_name,
      email: userRow.email,
      phone: userRow.phone,
      nationality: userRow.nationality,
      passport_number: userRow.passport_number,
      address: userRow.address,
      role: userRow.role,
      email_verified: userRow.email_verified,
      created_at: userRow.created_at
    };
    const token = signToken(user);

    logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetType: 'user',
      targetRef: String(user.id),
      details: `Logged in as ${user.role}`,
      ipAddress: req.ip
    });

    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

// Get current session user
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

// Update profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { full_name, phone, nationality, passport_number, address } = req.body;
    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    db.prepare(`
      UPDATE users
      SET full_name = ?, phone = ?, nationality = ?, passport_number = ?, address = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      String(full_name).trim(),
      phone ? String(phone).trim() : '',
      nationality ? String(nationality).trim() : '',
      passport_number ? String(passport_number).trim() : '',
      address ? String(address).trim() : '',
      req.user.id
    );

    const updated = db.prepare('SELECT id, full_name, email, phone, nationality, passport_number, address, role, email_verified, created_at FROM users WHERE id = ?').get(req.user.id);
    return res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change password
router.put('/password', requireAuth, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || String(new_password).length < 8) {
      return res.status(400).json({ error: 'Current password and a new password of at least 8 characters are required.' });
    }

    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(current_password, userRow.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, req.user.id);

    logAudit({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'CHANGE_PASSWORD',
      targetType: 'user',
      targetRef: String(req.user.id),
      details: 'Password changed by user',
      ipAddress: req.ip
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Verify email address
router.post('/verify-email', requireAuth, (req, res) => {
  try {
    const { code } = req.body;
    const row = db.prepare('SELECT verification_token, email_verified FROM users WHERE id = ?').get(req.user.id);
    if (row.email_verified) {
      return res.json({ message: 'Email is already verified.' });
    }
    const expectedShort = (row.verification_token || '').slice(0, 8).toUpperCase();
    if (!code || (String(code).trim().toUpperCase() !== expectedShort && String(code).trim() !== row.verification_token)) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    db.prepare("UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = datetime('now') WHERE id = ?").run(req.user.id);
    const updated = db.prepare('SELECT id, full_name, email, phone, nationality, passport_number, address, role, email_verified, created_at FROM users WHERE id = ?').get(req.user.id);
    return res.json({ message: 'Email verified successfully!', user: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// Forgot password — generates reset token and sends notification/email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please provide your registered email address.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT id, full_name, email FROM users WHERE lower(email) = ?').get(cleanEmail);
    if (!user) {
      // Do not leak enumeration, return friendly message
      return res.json({ message: 'If that email address is registered, a password reset code has been dispatched.' });
    }

    const resetCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    db.prepare("UPDATE users SET reset_token = ?, reset_expires = datetime('now', '+1 hour') WHERE id = ?").run(resetCode, user.id);

    await sendEmailNotification({
      to: user.email,
      subject: 'KOLA TOURS AND TRAVEL — Password Reset Code',
      text: `Hello ${user.full_name}, your password reset code is: ${resetCode} (valid for 1 hour).`,
      html: `<p>Hello <strong>${user.full_name}</strong>,</p><p>Your password reset code is: <strong><code>${resetCode}</code></strong> (valid for 1 hour).</p>`
    });

    return res.json({
      message: 'Password reset code generated and sent to your email.',
      // Included in dev/demo mode when SMTP is unconfigured so testing password recovery works out-of-the-box
      dev_reset_code: !process.env.SMTP_HOST ? resetCode : undefined
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// Reset password using code
router.post('/reset-password', (req, res) => {
  try {
    const { email, reset_code, new_password } = req.body;
    if (!email || !reset_code || !new_password || String(new_password).length < 8) {
      return res.status(400).json({ error: 'Email, reset code, and a new password (min 8 chars) are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.prepare("SELECT id, email, reset_token FROM users WHERE lower(email) = ? AND reset_expires > datetime('now')").get(cleanEmail);
    if (!user || !user.reset_token || user.reset_token.toUpperCase() !== String(reset_code).trim().toUpperCase()) {
      return res.status(400).json({ error: 'Invalid or expired reset code.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    db.prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = datetime('now') WHERE id = ?").run(newHash, user.id);

    logAudit({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: 'customer',
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'user',
      targetRef: String(user.id),
      details: 'Password reset via recovery token',
      ipAddress: req.ip
    });

    return res.json({ message: 'Your password has been reset successfully. You can now log in.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;

