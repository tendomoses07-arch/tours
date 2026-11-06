const nodemailer = require('nodemailer');
const { db } = require('./db');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
    return transporter;
  }
  return null;
}

async function sendEmailNotification({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || 'KOLA TOURS AND TRAVEL <no-reply@kolatours.com>';
  const activeTransport = getTransporter();
  if (activeTransport) {
    try {
      await activeTransport.sendMail({ from, to, subject, text, html });
      return { sent: true, mode: 'smtp' };
    } catch (err) {
      console.error('SMTP Email dispatch error:', err.message);
      return { sent: false, mode: 'smtp_error', error: err.message };
    }
  } else {
    // Development / unconfigured SMTP safe fallback log
    console.log(`[EMAIL DISPATCH LOG] To: ${to} | Subject: ${subject}`);
    return { sent: true, mode: 'logged' };
  }
}

function createNotification({ userId = null, isAdminTarget = 0, title, message, type = 'info', relatedRequestRef = '' }) {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, is_admin_target, title, message, type, related_request_ref)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, isAdminTarget ? 1 : 0, title, message, type, relatedRequestRef);
  } catch (err) {
    console.error('Notification DB error:', err.message);
  }
}

module.exports = {
  sendEmailNotification,
  createNotification
};

