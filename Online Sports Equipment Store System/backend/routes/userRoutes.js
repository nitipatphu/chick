const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

//  GET All Users (Admin Only)
router.get('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const db = await getDB();
    const users = db.data.users.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || null
    }));
    
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

//GET User by ID (Admin Only)
router.get('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const db = await getDB();
    const user = db.data.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// CREATE User (Admin Only) 
router.post('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { username, password, email, fullName, phone, role } = req.body;

   
    if (!username || !password || !email) {
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

    const validRoles = ['customer', 'staff', 'administrator'];
    const userRole = role && validRoles.includes(role) ? role : 'customer';

    const newUser = {
      id: generateId(),
      username,
      password: 'password123',
      email,
      fullName: fullName || username,
      phone: phone || '',
      role: userRole,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: null
    };

    db.data.users.push(newUser);
    await db.write();

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      data: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// UPDATE User (Admin Only)
router.put('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { fullName, email, phone, role, password } = req.body;

    const db = await getDB();
    const index = db.data.users.findIndex(u => u.id === userId);

    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    const currentUser = db.data.users[index];

    
    if (email && email !== currentUser.email) {
      const existingEmail = db.data.users.find(u => u.email === email && u.id !== userId);
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          error: 'อีเมลนี้มีอยู่แล้ว' 
        });
      }
    }

    const validRoles = ['customer', 'staff', 'administrator'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: `Role ไม่ถูกต้อง ต้องเป็น: ${validRoles.join(', ')}` 
      });
    }

   
    if (userId === req.user.id && role && role !== currentUser.role) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถเปลี่ยน Role ของตัวเองได้' 
      });
    }

    const updatedUser = {
      ...currentUser,
      fullName: fullName || currentUser.fullName,
      email: email || currentUser.email,
      phone: phone !== undefined ? phone : currentUser.phone,
      role: role || currentUser.role,
      updatedAt: new Date().toISOString()
    };

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
        });
      }
      updatedUser.password = 'password123';
    }

    db.data.users[index] = updatedUser;
    await db.write();

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
      data: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE User (Admin Only)
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

    const index = db.data.users.findIndex(u => u.id === userId);
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    const deletedUser = db.data.users[index];
    
    
    const adminCount = db.data.users.filter(u => u.role === 'administrator').length;
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
      message: `ลบผู้ใช้ "${deletedUser.username}" สำเร็จ`,
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