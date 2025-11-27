import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  const PORT = process.env.PORT || 5001;
  const baseURL = `http://localhost:${PORT}`;

  console.log('🧪 Testing Backend Configuration...\n');
  console.log(`Backend URL: ${baseURL}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}\n`);

  if (!process.env.JWT_SECRET) {
    console.log('❌ JWT_SECRET is required in .env file');
    console.log('   Add: JWT_SECRET=your-secret-key-here');
  }

  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI is required in .env file');
    console.log('   Add: MONGODB_URI=mongodb://your-connection-string');
  }

  try {
    // Test health endpoint using fetch
    console.log('\n1. Testing /api/health...');
    const healthResponse = await fetch(`${baseURL}/api/health`);
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ Health check:', data);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }

    // Test login endpoint (should fail with 400, not 500)
    console.log('\n2. Testing /api/auth/login (missing fields)...');
    const loginResponse1 = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (loginResponse1.status === 400) {
      console.log('✅ Login endpoint responds correctly (400 for missing fields)');
    } else {
      const data = await loginResponse1.json();
      console.log('❌ Unexpected error:', loginResponse1.status, data);
    }

    // Test login with invalid credentials
    console.log('\n3. Testing /api/auth/login (invalid credentials)...');
    const loginResponse2 = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test1',
        password: 'wrongpassword',
        role: 'student'
      })
    });
    if (loginResponse2.status === 401) {
      console.log('✅ Login endpoint responds correctly (401 for invalid credentials)');
    } else if (loginResponse2.status === 500) {
      const data = await loginResponse2.json();
      console.log('❌ Server error (500):', data);
      console.log('   This indicates a backend issue. Check server logs.');
    } else {
      const data = await loginResponse2.json();
      console.log('❌ Unexpected error:', loginResponse2.status, data);
    }

    console.log('\n✅ All tests completed!');
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      console.log('\n❌ Connection refused! Backend is not running on port', PORT);
      console.log('   Please start the backend: cd backend && npm run dev');
    } else {
      console.log('\n❌ Error:', error.message);
    }
  }
};

testConnection();

