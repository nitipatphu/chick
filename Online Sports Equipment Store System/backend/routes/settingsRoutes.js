const express = require('express');
const router = express.Router();
const { getDB } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/public', async (req, res) => {
  try {
    const db = await getDB();
    const settings = {};
    for (let i = 0; i < db.data.settings.length; i++) {
      const setting = db.data.settings[i];
      settings[setting.key] = setting.value;
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const db = await getDB();
    const settings = {};
    for (let i = 0; i < db.data.settings.length; i++) {
      const setting = db.data.settings[i];
      settings[setting.key] = setting.value;
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const newSettings = req.body;
    const db = await getDB();

    const keys = Object.keys(newSettings);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = newSettings[key];
      const setting = db.data.settings.find((s) => s.key === key);
      if (setting !== undefined) {
        setting.value = value;
        setting.updatedAt = new Date().toISOString();
      } else {
        db.data.settings.push({
          id: Date.now() + Math.random() * 1000,
          key: key,
          value: value,
          description: '',
          createdAt: new Date().toISOString()
        });
      }
    }

    await db.write();

    const settings = {};
    for (let i = 0; i < db.data.settings.length; i++) {
      const setting = db.data.settings[i];
      settings[setting.key] = setting.value;
    }

    res.json({
      success: true,
      message: 'อัปเดตการตั้งค่าระบบสำเร็จ',
      settings: settings
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;