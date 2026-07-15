const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this';

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

  if (password !== user.password) {
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

router.post('/register', async (req, res) => {
  const { username, password, email, fullName, phone } = req.body;

  console.log('Register request body:', req.body);

  if (!username || !password || !email) {
    return res.status(400).json({ 
      success: false, 
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
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
    password: password,
    email,
    fullName: fullName || username,
    phone: phone || '',
    role: 'customer',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: null
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

router.post('/reset-password', async (req, res) => {
  const { username, email, newPassword } = req.body;

  if (!username || !email || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
    });
  }

  const db = await getDB();
  const user = db.data.users.find(u => u.username === username && u.email === email);

  if (!user) {
    return res.status(404).json({ 
      success: false, 
      error: 'ไม่พบผู้ใช้ หรือชื่อผู้ใช้และอีเมลไม่ตรงกัน' 
    });
  }

  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  await db.write();

  res.json({
    success: true,
    message: 'รีเซ็ตรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
  });
});

module.exports = router;