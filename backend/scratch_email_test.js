const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const testBrevoApi = async () => {
  const apiKey = process.env.SMTP_PASS; // This is the xsmtpsib- key
  const senderEmail = process.env.SENDER_EMAIL || 'vinusxtech@gmail.com';
  const senderName = process.env.SENDER_NAME || 'SISTec Hostel Management';

  console.log('Testing Brevo API with Key:', apiKey ? apiKey.substring(0, 15) + '...' : 'none');
  console.log('Sender Email:', senderEmail);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [
          {
            email: 'vinusxtech@gmail.com',
            name: 'VinusXTech Test'
          }
        ],
        subject: 'API Connection Test',
        htmlContent: '<html><body><h1>Render HTTP API Bypass Test</h1><p>If you see this, the HTTP API integration bypasses the SMTP port blocking successfully!</p></body></html>'
      })
    });

    const status = response.status;
    const text = await response.text();
    console.log('Response Status:', status);
    console.log('Response Body:', text);

    if (status === 201 || status === 200) {
      console.log('✅ API call succeeded! The xsmtpsib- key IS accepted as an API key for Brevo REST API!');
    } else {
      console.log('❌ API call failed.');
    }
  } catch (err) {
    console.error('Error during fetch:', err);
  }
};

testBrevoApi();
