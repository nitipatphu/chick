const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this';

//  Login 
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' 
    });
  }

  const db = await getDB();
  const user = db.data.users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: 'ไม่พบผู้ใช้นี้ในระบบ' 
    });
  }

  // รหัสผ่านทดสอบ (ในโปรดักชันใช้ bcrypt)
  if (password !== 'password123') {
    return res.status(401).json({ 
      success: false, 
      error: 'รหัสผ่านไม่ถูกต้อง' 
    });
  }

  const token = jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      fullName: user.fullName 
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
});

//  Register 
router.post('/register', async (req, res) => {
  const { username, password, email, fullName, phone } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ 
      success: false, 
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
    });
  }

  const db = await getDB();

  if (db.data.users.find(u => u.username === username)) {
    return res.status(400).json({ 
      success: false, 
      error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
    });
  }

  if (db.data.users.find(u => u.email === email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'อีเมลนี้มีอยู่แล้ว' 
    });
  }

  const newUser = {
    id: generateId(),
    username,
    password: 'password123', // ในโปรดักชัน: bcrypt.hashSync(password, 10)
    email,
    fullName: fullName || username,
    phone: phone || '',
    role: 'customer',
    createdAt: new Date().toISOString().split('T')[0]
  };

  db.data.users.push(newUser);
  await db.write();

  const token = jwt.sign(
    { 
      id: newUser.id, 
      username: newUser.username, 
      role: newUser.role,
      fullName: newUser.fullName 
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// Get Current User
router.get('/me', authenticate, async (req, res) => {
  const db = await getDB();
  const user = db.data.users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ 
      success: false, 
      error: 'ไม่พบผู้ใช้' 
    });
  }

  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role
  });
});

module.exports = router;