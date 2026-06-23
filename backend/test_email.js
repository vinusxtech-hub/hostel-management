const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const emailService = require('./src/services/emailService');

async function testEmail() {
  try {
    console.log("Testing email sending...");
    console.log("SMTP User:", process.env.SMTP_USER);
    console.log("SMTP Pass starts with:", process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 10) + "..." : "undefined");
    console.log("Sender Email:", process.env.SENDER_EMAIL);
    console.log("Sender Name:", process.env.SENDER_NAME);

    // Attempt to send a test password reset email to sambhavlmgroup@gmail.com
    await emailService.sendPasswordResetEmail(
      'sambhavlmgroup@gmail.com',
      'Test User',
      'http://localhost:5173/reset-password?token=testtoken123'
    );
    console.log("Test execution finished.");
  } catch (err) {
    console.error("Test email failed with error:", err);
  }
}

testEmail();
