const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// =Middleware 
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Routes
app.use('/api', routes);

//  Health Check 
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error Handler 
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `ไม่พบเส้นทาง ${req.method} ${req.originalUrl}`
  });
});

// Start Server 
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 BACKEND');
  console.log('📡 Server running on http://localhost:' + PORT);
  console.log('📊 API Base: http://localhost:' + PORT + '/api');
  console.log('='.repeat(60));
  console.log('\n🔐 Test Accounts:');
  console.log('  👤 Customer: customer1 / password123');
  console.log('  👤 Staff:    staff1 / password123');
  console.log('  👤 Admin:    admin / password123');
  console.log('\n📋 API Endpoints:');
  console.log('  🔑 POST   /api/auth/login');
  console.log('  📝 POST   /api/auth/register');
  console.log('  📦 GET    /api/products');
  console.log('  🛒 GET    /api/cart');
  console.log('  📄 GET    /api/orders');
  console.log('  👥 GET    /api/users (Admin Only)');
  console.log('  📊 GET    /api/reports/dashboard (Admin Only)');
  console.log('='.repeat(60));
});