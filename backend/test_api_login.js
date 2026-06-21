const testLogin = async () => {
  const email = 'sambhavmehra07@gmail.com';
  const password = 'GCxxRkW7W!';
  const url = 'http://localhost:5000/api/auth/login';

  console.log(`Sending POST request to ${url} with email: ${email}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
};

testLogin();
