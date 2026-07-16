const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const db = await getDB();
    const users = [];
    
    for (let i = 0; i < db.data.users.length; i++) {
        const user = db.data.users[i];
        let updatedAt = user.updatedAt;
        if (updatedAt === undefined) updatedAt = null;

        users.push({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            password: user.password,
            createdAt: user.createdAt,
            updatedAt: updatedAt
        });
    }
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.get('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const db = await getDB();
    const user = db.data.users.find((u) => u.id === userId);

    if (user === undefined) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { username, password, email, fullName, phone, role } = req.body;

    if (username === undefined || username === '' || password === undefined || password === '' || email === undefined || email === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (username, password, email)' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' 
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

    const validRoles = ['customer', 'staff', 'administrator'];
    let userRole = 'customer';
    
    if (role !== undefined) {
        for (let i = 0; i < validRoles.length; i++) {
            if (role === validRoles[i]) {
                userRole = role;
            }
        }
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
      role: userRole,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: null
    };

    db.data.users.push(newUser);
    await db.write();

    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      data: newUser
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.put('/profile/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, avatar, currentPassword, newPassword } = req.body;

    const db = await getDB();
    const index = db.data.users.findIndex((u) => u.id === userId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบผู้ใช้'
      });
    }

    const currentUser = db.data.users[index];

    if (newPassword !== undefined && newPassword !== '') {
      if (currentPassword === undefined || currentPassword !== currentUser.password) {
        return res.status(400).json({
          success: false,
          error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
        });
      }
    }

    if (avatar !== undefined && avatar.length > 2800000) {
      return res.status(400).json({
        success: false,
        error: 'ไฟล์รูปภาพใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กกว่านี้'
      });
    }

    let updatedFullName = fullName;
    if (updatedFullName === undefined) updatedFullName = currentUser.fullName;

    let updatedPhone = phone;
    if (updatedPhone === undefined) updatedPhone = currentUser.phone;

    let updatedAvatar = avatar;
    if (updatedAvatar === undefined) updatedAvatar = currentUser.avatar;

    let updatedPassword = newPassword;
    if (updatedPassword === undefined || updatedPassword === '') {
        updatedPassword = currentUser.password;
    }

    const updatedUser = {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      role: currentUser.role,
      createdAt: currentUser.createdAt,
      fullName: updatedFullName,
      phone: updatedPhone,
      avatar: updatedAvatar,
      password: updatedPassword,
      updatedAt: new Date().toISOString()
    };

    db.data.users[index] = updatedUser;
    await db.write();

    res.json({
      success: true,
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      data: {
          id: updatedUser.id,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { fullName, email, phone, role, password } = req.body;

    const db = await getDB();
    const index = db.data.users.findIndex((u) => u.id === userId);

    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    const currentUser = db.data.users[index];

    if (email !== undefined && email !== currentUser.email) {
      const existingEmail = db.data.users.find((u) => u.email === email && u.id !== userId);
      if (existingEmail !== undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'อีเมลนี้มีอยู่แล้ว' 
        });
      }
    }

    const validRoles = ['customer', 'staff', 'administrator'];
    if (role !== undefined) {
        let isValidRole = false;
        for (let i = 0; i < validRoles.length; i++) {
            if (role === validRoles[i]) {
                isValidRole = true;
            }
        }
        if (isValidRole === false) {
            return res.status(400).json({ 
                success: false, 
                error: 'Role ไม่ถูกต้อง' 
            });
        }
    }

    if (userId === req.user.id && role !== undefined && role !== currentUser.role) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถเปลี่ยน Role ของตัวเองได้' 
      });
    }

    let updatedFullName = fullName;
    if (updatedFullName === undefined || updatedFullName === '') {
        updatedFullName = currentUser.fullName;
    }
    
    let updatedEmail = email;
    if (updatedEmail === undefined || updatedEmail === '') {
        updatedEmail = currentUser.email;
    }
    
    let updatedPhone = phone;
    if (updatedPhone === undefined) updatedPhone = currentUser.phone;
    
    let updatedRole = role;
    if (updatedRole === undefined || updatedRole === '') {
        updatedRole = currentUser.role;
    }
    
    let updatedPassword = password;
    if (updatedPassword === undefined || updatedPassword === '') {
        updatedPassword = currentUser.password;
    }

    const updatedUser = {
      id: currentUser.id,
      username: currentUser.username,
      createdAt: currentUser.createdAt,
      fullName: updatedFullName,
      email: updatedEmail,
      phone: updatedPhone,
      role: updatedRole,
      password: updatedPassword,
      updatedAt: new Date().toISOString()
    };

    db.data.users[index] = updatedUser;
    await db.write();

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
      data: updatedUser
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const db = await getDB();

    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถลบบัญชีของตัวเองได้' 
      });
    }

    const index = db.data.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    const deletedUser = db.data.users[index];
    
    let adminCount = 0;
    for (let i = 0; i < db.data.users.length; i++) {
        if (db.data.users[i].role === 'administrator') {
            adminCount = adminCount + 1;
        }
    }
    
    if (deletedUser.role === 'administrator' && adminCount <= 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้' 
      });
    }

    db.data.users.splice(index, 1);
    await db.write();

    res.json({
      success: true,
      message: 'ลบผู้ใช้ ' + deletedUser.username + ' สำเร็จ',
      data: {
        id: deletedUser.id,
        username: deletedUser.username
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;