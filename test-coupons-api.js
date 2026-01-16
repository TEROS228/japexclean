// Quick test script for coupons API
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'A5omKGMJNk+K9NDy/nd7deAAa8y4UXGTuw6Ta+2yhwU=';

// Create test token for CEO@gmail.com
const token = jwt.sign(
  { email: 'CEO@gmail.com', role: 'user' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Test Token:', token);
console.log('\nTest the API with:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/user/coupons`);
