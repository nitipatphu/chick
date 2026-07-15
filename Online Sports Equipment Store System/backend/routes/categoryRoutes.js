const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    res.json(db.data.categories);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE a category (Staff + Admin)
router.post('/', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อหมวดหมู่' });
    }

    const db = await getDB();
    
    // Check for duplicate name
    if (db.data.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
       return res.status(400).json({ success: false, error: 'มีหมวดหมู่นี้อยู่ในระบบแล้ว' });
    }

    const newCategory = {
      id: generateId(),
      name
    };

    db.data.categories.push(newCategory);
    await db.write();

    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE a category (Staff + Admin)
router.put('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, icon } = req.body;

    const db = await getDB();
    const index = db.data.categories.findIndex(c => c.id === categoryId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });
    }

    if (!name) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อหมวดหมู่' });
    }

    // Check duplicate name (excluding self)
    if (db.data.categories.find(c => c.id !== categoryId && c.name.toLowerCase() === name.toLowerCase())) {
       return res.status(400).json({ success: false, error: 'มีหมวดหมู่นี้อยู่ในระบบแล้ว' });
    }

    db.data.categories[index] = {
      ...db.data.categories[index],
      name
    };

    await db.write();
    res.json({ success: true, category: db.data.categories[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a category (Staff + Admin)
router.delete('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const db = await getDB();
    
    // Check if any products use this category
    const hasProducts = db.data.products.some(p => p.categoryId === categoryId);
    if (hasProducts) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากยังมีสินค้าในหมวดหมู่นี้' 
      });
    }

    const index = db.data.categories.findIndex(c => c.id === categoryId);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'ไม่พบหมวดหมู่' });
    }

    db.data.categories.splice(index, 1);
    await db.write();

    res.json({ success: true, message: 'ลบหมวดหมู่สำเร็จ' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
