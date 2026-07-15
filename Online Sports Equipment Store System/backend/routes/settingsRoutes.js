const express = require('express');
const router = express.Router();
const { getDB } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

// ============ GET Settings (Public) ============
router.get('/public', async (req, res) => {
  try {
    const db = await getDB();
    const settings = {};
    db.data.settings.forEach(setting => {
      settings[setting.key] = setting.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ GET Settings (Admin Only) ============
router.get('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const db = await getDB();
    const settings = {};
    db.data.settings.forEach(setting => {
      settings[setting.key] = setting.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ UPDATE Settings (Admin Only) ============
router.put('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const newSettings = req.body;
    const db = await getDB();

    for (const [key, value] of Object.entries(newSettings)) {
      const setting = db.data.settings.find(s => s.key === key);
      if (setting) {
        setting.value = value;
        setting.updatedAt = new Date().toISOString();
      } else {
        db.data.settings.push({
          id: Date.now() + Math.random() * 1000,
          key,
          value,
          description: '',
          createdAt: new Date().toISOString()
        });
      }
    }

    await db.write();

    const settings = {};
    db.data.settings.forEach(setting => {
      settings[setting.key] = setting.value;
    });

    res.json({
      success: true,
      message: 'อัปเดตการตั้งค่าระบบสำเร็จ',
      settings
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;