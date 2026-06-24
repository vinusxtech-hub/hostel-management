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
  const recipientEmail = payload.to?.[0]?.email;
  const apiKey = process.env.BREVO_API_KEY || 
    (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xkeysib-') ? process.env.SMTP_PASS : null);

  if (apiKey) {
    console.log(`[EmailService] Sending email to ${recipientEmail} using Brevo HTTP API...`);
    // Format payload for Brevo API
    const apiPayload = {
      sender: {
        name: payload.sender.name,
        email: payload.sender.email
      },
      to: payload.to.map(t => ({ email: t.email, name: t.name || '' })),
      subject: payload.subject,
      htmlContent: payload.htmlContent
    };

    return fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    })
      .then(async (response) => {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`Brevo HTTP API responded with status ${response.status}: ${text}`);
        }
        let data = {};
        try { data = JSON.parse(text); } catch(e) {}
        console.log(`[EmailService] Email sent successfully to ${recipientEmail} via HTTP (Msg ID: ${data.messageId || 'N/A'})`);
        return data;
      })
      .catch((err) => {
        console.error(`[EmailService] Failed to send email to ${recipientEmail} via HTTP API: ${err.message}`);
        throw err;
      });
  }

  // Fallback to standard SMTP if no API key is configured
  const transporter = getTransporter();
  if (!transporter) {
    const err = new Error('SMTP relay not fully configured.');
    console.error(`[EmailService] Failed to send email to ${recipientEmail}: ${err.message}`);
    return Promise.reject(err);
  }

  const mailOptions = {
    from: `"${payload.sender.name}" <${payload.sender.email}>`,
    to: recipientEmail,
    subject: payload.subject,
    html: payload.htmlContent
  };

  return transporter.sendMail(mailOptions)
    .then((info) => {
      console.log(`[EmailService] Email sent successfully to ${recipientEmail} via SMTP (Msg ID: ${info.messageId})`);
      return info;
    })
    .catch((err) => {
      console.error(`[EmailService] Failed to send email to ${recipientEmail} via SMTP: ${err.message}`);
      throw err;
    });
};

/**
 * Build the HTML for a credentials email.
 */
const buildCredentialsHtml = ({ name, loginUsername, password, role, portalUrl }) => {
  const roleLabel = role === 'warden' ? 'Warden' : role === 'guard' ? 'Guard' : 'Student';
  const roleColor = role === 'warden' ? '#7c3aed' : role === 'guard' ? '#10b981' : '#4f46e5';
  const roleDesc = role === 'warden'
    ? 'You can now log in to manage students, approve leaves, and handle hostel administration.'
    : role === 'guard'
    ? 'You can now log in to verify student leave passes and scan gate QR codes.'
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
 * Send a password reset email.
 */
exports.sendPasswordResetEmail = async (recipientEmail, name, resetLink) => {
  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';
  const senderEmail = process.env.SENDER_EMAIL || 'no-reply@sistechostel.in';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail, name }],
    subject: 'SISTec Hostel — Reset Your Password',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SISTec Hostel — Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 36px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .content { padding: 32px; }
    .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .btn { display: inline-block; background: #4f46e5; color: #fff !important; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px; text-decoration: none; margin-top: 20px; }
    .warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-top: 16px; font-size: 13px; color: #92400e; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🏛️ SISTEC HOSTEL PORTAL</h1>
        <p>Password Reset Request</p>
      </div>
      <div class="content">
        <p class="greeting">Hello ${name},</p>
        <p>We received a request to reset the password for your SISTec Hostel Portal account. Click the button below to choose a new password. This link is valid for 15 minutes.</p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="btn">Reset Password →</a>
        </div>
        <p style="font-size: 13px; margin-top: 24px; color: #64748b; word-break: break-all;">
          If the button doesn't work, copy and paste this link into your browser: <br/>
          <a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a>
        </p>
        <div class="warning">
          ⚠️ <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email or contact the admin.
        </div>
      </div>
      <div class="footer">
        <p>This is an automated email. Do not reply to this message.</p>
        <p>© 2026 SISTec Hostel Administration. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  };

  console.log(`[EmailService] Sending password reset email to ${recipientEmail}...`);
  return sendBrevoEmail(payload).catch(err => {
    console.error(`[EmailService] Failed to send password reset email to ${recipientEmail}: ${err.message}`);
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

/**
 * Send an email notification for a leave request decision.
 */
exports.sendLeaveStatusEmail = async (recipientEmail, name, status, startDate, endDate, remarks, actionBy) => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';
  const senderEmail = process.env.SENDER_EMAIL || 'no-reply@sistechostel.in';
  
  const isApproved = status === 'Approved';
  const themeColor = isApproved ? '#10b981' : '#ef4444';
  const statusLabel = isApproved ? 'APPROVED ✅' : 'REJECTED ❌';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail, name }],
    subject: `Leave Pass Request Update — ${statusLabel}`,
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SISTec Hostel — Leave Pass Update</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, ${themeColor} 0%, #6366f1 100%); padding: 36px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .content { padding: 32px; }
    .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .status-badge { display: inline-block; background: ${themeColor}1a; color: ${themeColor}; border: 1px solid ${themeColor}33; border-radius: 20px; padding: 6px 16px; font-size: 13px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 22px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
    .detail-row:first-child { padding-top: 0; }
    .detail-label { font-weight: 600; color: #64748b; }
    .detail-value { font-weight: 700; color: #0f172a; }
    .remarks-box { background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isApproved ? '#bbf7d0' : '#fecaca'}; border-radius: 12px; padding: 16px 20px; font-size: 14px; color: ${isApproved ? '#166534' : '#991b1b'}; margin-top: 16px; }
    .btn { display: inline-block; background: #4f46e5; color: #fff !important; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px; text-decoration: none; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🏛️ SISTEC HOSTEL PORTAL</h1>
        <p>Leave Pass Request Decided</p>
      </div>
      <div class="content">
        <span class="status-badge">${statusLabel}</span>
        <p class="greeting">Hello ${name},</p>
        <p>Your leave request has been reviewed by your hostel administration.</p>
        
        <div class="details-box">
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value" style="color: ${themeColor};">${status}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Start Date</span>
            <span class="detail-value">${new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">End Date</span>
            <span class="detail-value">${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Reviewed By</span>
            <span class="detail-value">${actionBy}</span>
          </div>
        </div>

        <div class="remarks-box">
          <strong>Warden Remarks:</strong><br/>
          ${remarks || 'No remarks provided.'}
        </div>

        ${isApproved ? `<p style="font-size: 13px; color: #475569; margin-top: 16px;">⚠️ <strong>Note:</strong> Your QR code is valid for exactly <strong>3 hours</strong> from the time of approval. If it expires, you must apply again.</p>` : ''}

        <div style="text-align: center;">
          <a href="${portalUrl}/login" class="btn">View Portal Dashboard</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated email. Do not reply to this message.</p>
        <p>© 2026 SISTec Hostel Administration. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
  };

  console.log(`[EmailService] Sending leave status email (${status}) to ${recipientEmail}...`);
  return sendBrevoEmail(payload).catch(err => {
    console.error(`[EmailService] Failed to send leave status email to ${recipientEmail}: ${err.message}`);
  });
};

/**
 * Send an email notification for a new notice.
 */
exports.sendNoticeEmail = async (recipientEmail, name, title, content) => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';
  const senderEmail = process.env.SENDER_EMAIL || 'no-reply@sistechostel.in';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail, name }],
    subject: `🚨 New Hostel Notice: ${title}`,
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SISTec Hostel — New Notice</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 36px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .content { padding: 32px; }
    .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .notice-title { font-size: 18px; font-weight: 800; color: #1e293b; margin: 20px 0 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
    .notice-body { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; font-size: 14px; color: #334155; white-space: pre-line; }
    .btn { display: inline-block; background: #f59e0b; color: #fff !important; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px; text-decoration: none; margin-top: 24px; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>📢 SISTEC HOSTEL NOTICE</h1>
        <p>New Announcement Published</p>
      </div>
      <div class="content">
        <p class="greeting">Hello ${name},</p>
        <p>A new official announcement has been published on the hostel portal. Please read the details below:</p>
        
        <h2 class="notice-title">${title}</h2>
        <div class="notice-body">
          ${content}
        </div>

        <div style="text-align: center;">
          <a href="${portalUrl}/login" class="btn">Log In to View Notices</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated email. Do not reply to this message.</p>
        <p>© 2026 SISTec Hostel Administration. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
  };

  console.log(`[EmailService] Sending notice email ("${title}") to ${recipientEmail}...`);
  return sendBrevoEmail(payload).catch(err => {
    console.error(`[EmailService] Failed to send notice email to ${recipientEmail}: ${err.message}`);
  });
};

/**
 * Send an email reminder to mark attendance.
 */
exports.sendAttendanceReminderEmail = async (recipientEmail, name) => {
  const portalUrl = process.env.PORTAL_URL || 'http://localhost:5173';
  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';
  const senderEmail = process.env.SENDER_EMAIL || 'no-reply@sistechostel.in';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail, name }],
    subject: `⏰ Attendance Reminder — Action Required`,
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SISTec Hostel — Attendance Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%); padding: 36px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .content { padding: 32px; }
    .greeting { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
    .warning-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px 20px; font-size: 14px; color: #92400e; margin: 20px 0; }
    .btn { display: inline-block; background: #4f46e5; color: #fff !important; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px; text-decoration: none; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>⏰ ATTENDANCE REMINDER</h1>
        <p>Action Required</p>
      </div>
      <div class="content">
        <p class="greeting">Hello ${name},</p>
        <p>This is a reminder from the hostel administration that you have not yet marked your attendance for today.</p>
        
        <div class="warning-box">
          ⚠️ <strong>Please Note:</strong> You must be inside the hostel campus bounds to mark your attendance via geofencing. Please ensure you mark your attendance before the daily cutoff time to avoid being marked absent.
        </div>

        <div style="text-align: center;">
          <a href="${portalUrl}/login" class="btn">Mark Attendance Now →</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated email. Do not reply to this message.</p>
        <p>© 2026 SISTec Hostel Administration. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`
  };

  console.log(`[EmailService] Sending attendance reminder email to ${recipientEmail}...`);
  return sendBrevoEmail(payload).catch(err => {
    console.error(`[EmailService] Failed to send attendance reminder email to ${recipientEmail}: ${err.message}`);
  });
};
