const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

let SECRET_KEY = process.env.JWT_SECRET;
if (SECRET_KEY === undefined) {
  SECRET_KEY = 'your-secret-key-change-this';
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === undefined || username === '' || password === undefined || password === '') {
    return res.status(400).json({ 
      success: false, 
      error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' 
    });
  }

  const db = await getDB();
  const user = db.data.users.find((u) => u.username === username);

  if (user === undefined) {
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
    token: token,
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

  if (username === undefined || username === '' || password === undefined || password === '' || email === undefined || email === '') {
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

  const existingUsername = db.data.users.find((u) => u.username === username);
  if (existingUsername !== undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' 
    });
  }

  const existingEmail = db.data.users.find((u) => u.email === email);
  if (existingEmail !== undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'อีเมลนี้มีอยู่แล้ว' 
    });
  }

  let finalFullName = fullName;
  if (finalFullName === undefined || finalFullName === '') {
    finalFullName = username;
  }

  let finalPhone = phone;
  if (finalPhone === undefined) {
    finalPhone = '';
  }

  const newUser = {
    id: generateId(),
    username: username,
    password: password,
    email: email,
    fullName: finalFullName,
    phone: finalPhone,
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
    token: token,
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
  const user = db.data.users.find((u) => u.id === req.user.id);

  if (user === undefined) {
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

  if (username === undefined || username === '' || email === undefined || email === '' || newPassword === undefined || newPassword === '') {
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
  const user = db.data.users.find((u) => u.username === username && u.email === email);

  if (user === undefined) {
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