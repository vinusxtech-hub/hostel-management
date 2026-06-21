const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Helper to create and return SMTP transporter
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

/**
 * Core Brevo SMTP sender function.
 * @param {object} payload - email payload
 * @returns {Promise}
 */
const sendBrevoEmail = (payload) => {
  const transporter = getTransporter();
  const recipientEmail = payload.to?.[0]?.email;

  if (!transporter) {
    console.warn(`[EmailService] SMTP relay not fully configured. Email to ${recipientEmail} skipped.`);
    console.log(`[EmailService] Credentials fallback logged to console: email=${recipientEmail}`);
    return Promise.resolve({ skipped: true });
  }

  const mailOptions = {
    from: `"${payload.sender.name}" <${payload.sender.email}>`,
    to: recipientEmail,
    subject: payload.subject,
    html: payload.htmlContent
  };

  return transporter.sendMail(mailOptions)
    .then((info) => {
      console.log(`[EmailService] Email sent successfully to ${recipientEmail} (Msg ID: ${info.messageId})`);
      return info;
    })
    .catch(async (err) => {
      console.error(`[EmailService] Failed to send email to ${recipientEmail} via SMTP: ${err.message}`);
      
      // Fallback: save email as local HTML file for developer review
      try {
        const tempDir = path.resolve(__dirname, '../../temp/emails');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const fileName = `${Date.now()}_${recipientEmail.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        const filePath = path.join(tempDir, fileName);
        
        fs.writeFileSync(filePath, payload.htmlContent, 'utf8');
        
        console.warn('\n========================================================================');
        console.warn('📬  LOCAL EMAIL FALLBACK GENERATED:');
        console.warn(`An email to ${recipientEmail} could not be sent via SMTP.`);
        console.warn(`The HTML email content has been saved locally for preview:`);
        console.warn(`file:///${filePath.replace(/\\/g, '/')}`);
        console.warn('========================================================================\n');
      } catch (fsErr) {
        console.error('[EmailService] Failed to write local preview HTML file:', fsErr.message);
      }
      
      throw err;
    });
};

/**
 * Build the HTML for a credentials email.
 */
const buildCredentialsHtml = ({ name, loginUsername, password, role, portalUrl }) => {
  const roleLabel = role === 'warden' ? 'Warden' : 'Student';
  const roleColor = role === 'warden' ? '#7c3aed' : '#4f46e5';
  const roleDesc = role === 'warden'
    ? 'You can now log in to manage students, approve leaves, and handle hostel administration.'
    : 'You can now log in to mark geofenced attendance, apply for leaves, and track your activity.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SISTec Hostel — Account Created</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, ${roleColor} 0%, #6366f1 100%); padding: 36px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .content { padding: 32px; }
    .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .cred-box { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .cred-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .cred-row:last-child { border-bottom: none; padding-bottom: 0; }
    .cred-row:first-child { padding-top: 0; }
    .cred-label { width: 110px; font-weight: 600; color: #64748b; flex-shrink: 0; }
    .cred-value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 700; font-size: 13px; word-break: break-all; }
    .badge { display: inline-block; background: ${roleColor}1a; color: ${roleColor}; border: 1px solid ${roleColor}33; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
    .btn { display: inline-block; background: ${roleColor}; color: #fff !important; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px; text-decoration: none; margin-top: 20px; }
    .warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-top: 16px; font-size: 13px; color: #92400e; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🏛️ SISTEC HOSTEL PORTAL</h1>
        <p>Your account has been created</p>
      </div>
      <div class="content">
        <span class="badge">${roleLabel} Account</span>
        <p class="greeting">Hello ${name},</p>
        <p>${roleDesc}</p>
        <div class="cred-box">
          <div class="cred-row">
            <span class="cred-label">Portal URL</span>
            <span class="cred-value"><a href="${portalUrl}" style="color: ${roleColor}; text-decoration: none;">${portalUrl}</a></span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Username</span>
            <span class="cred-value">${loginUsername}</span>
          </div>
          <div class="cred-row">
            <span class="cred-label">Password</span>
            <span class="cred-value">${password}</span>
          </div>
        </div>
        <div class="warning">
          ⚠️ <strong>Security Notice:</strong> Please change your password immediately after your first login via your Profile page.
        </div>
        <a href="${portalUrl}/login" class="btn">Log In to Portal →</a>
      </div>
      <div class="footer">
        <p>This is an automated email. Do not reply to this message.</p>
        <p>© 2026 SISTec Hostel Administration. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send a welcome email with credentials to a student or warden.
 * @param {string} recipientEmail - Recipient email
 * @param {string} name  - Recipient name
 * @param {string} loginUsername - Generated login username
 * @param {string} password - Plaintext password (before hashing)
 * @param {string} role  - 'student' | 'warden' | 'guard'
 */
exports.sendWelcomeEmail = async (recipientEmail, name, loginUsername, password, role = 'student') => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
  const roleLabel = role === 'warden' ? 'Warden' : role === 'guard' ? 'Guard' : 'Student';
  const subject = `Welcome to SISTec Hostel Portal — Your ${roleLabel} Account Credentials`;

  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';
  const senderEmail = process.env.SENDER_EMAIL || 'no-reply@sistechostel.in';

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [{ email: recipientEmail, name }],
    subject,
    htmlContent: buildCredentialsHtml({ name, loginUsername, password, role, portalUrl })
  };

  // Always log credentials in case email fails
  console.log(`[EmailService] New ${roleLabel} account → recipient: ${recipientEmail} | username: ${loginUsername} | password: ${password}`);

  return sendBrevoEmail(payload).catch(err => {
    console.error(`[EmailService] Failed to send to ${recipientEmail}: ${err.message}`);
  });
};

/**
 * Send a password-changed notification email.
 */
exports.sendPasswordChangedEmail = async (email, name) => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';
  const senderEmail = process.env.SENDER_EMAIL || 'no-reply@sistechostel.in';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email, name }],
    subject: 'SISTec Hostel — Password Changed Successfully',
    htmlContent: `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8fafc;padding:40px 0;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:20px;">Password Changed</h1>
  </div>
  <div style="padding:28px;">
    <p style="font-size:15px;font-weight:700;color:#0f172a;">Hello ${name},</p>
    <p>Your SISTec Hostel Portal password was changed successfully.</p>
    <p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:13px;color:#166534;">
      ✅ If you made this change, no further action is needed.
    </p>
    <p style="font-size:13px;color:#64748b;">If you did not change your password, please contact the administrator immediately.</p>
    <a href="${portalUrl}/login" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px;">Log In to Portal</a>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">
    © 2026 SISTec Hostel Administration
  </div>
</div>
</body></html>
    `
  };

  return sendBrevoEmail(payload).catch(err => {
    console.error(`[EmailService] Password change notification failed for ${email}: ${err.message}`);
  });
};
