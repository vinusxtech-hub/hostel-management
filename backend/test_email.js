const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const testMail = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const senderEmail = process.env.SENDER_EMAIL || 'no-reply@sistechostel.in';
  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';

  console.log('Using config:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Sender: "${senderName}" <${senderEmail}>`);
  console.log('Password length:', pass ? pass.length : 0);

  if (!host || !user || !pass) {
    console.error('Error: SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured in .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: 'sambhavmehra07@gmail.com',
    subject: 'SISTec Hostel Portal — Test Email',
    html: `
      <h2>SMTP configuration is working!</h2>
      <p>This is a test email from the SISTec Hostel Management System.</p>
      <p>If you received this, the Brevo SMTP integration is working successfully.</p>
    `
  };

  try {
    console.log('Sending test email to sambhavmehra07@gmail.com...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    process.exit(0);
  } catch (error) {
    console.error('Error sending test email:', error);
    process.exit(1);
  }
};

testMail();
