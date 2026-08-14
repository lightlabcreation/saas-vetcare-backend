const http = require('http');

const data = JSON.stringify({
  adminName: 'Test Admin',
  businessName: 'Test Clinic',
  email: 'test' + Date.now() + '@test.com',
  mobile: '9' + String(Date.now()).slice(-9),
  password: 'Owner@123',
  confirmPassword: 'Owner@123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
