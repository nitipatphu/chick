const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

// GET All Addresses 
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const addresses = db.data.addresses.filter(a => a.userId === req.user.id);
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Address by ID 
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const address = db.data.addresses.find(a => a.id === parseInt(req.params.id));
    if (!address) {
      return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่' });
    }
    if (address.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์' });
    }
    res.json(address);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE Address 
router.post('/', authenticate, async (req, res) => {
  try {
    const { fullName, phone, address, district, city, province, postalCode, isDefault } = req.body;

    if (!fullName || !phone || !address || !city) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, เบอร์โทร, ที่อยู่, อำเภอ)' 
      });
    }

    const db = await getDB();


    if (isDefault) {
      db.data.addresses.forEach(a => {
        if (a.userId === req.user.id) a.isDefault = false;
      });
    }

    const newAddress = {
      id: generateId(),
      userId: req.user.id,
      fullName,
      phone,
      address,
      district: district || '',
      city,
      province: province || '',
      postalCode: postalCode || '',
      isDefault: isDefault || false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.data.addresses.push(newAddress);
    await db.write();

    res.status(201).json({
      success: true,
      message: 'เพิ่มที่อยู่สำเร็จ',
      data: newAddress
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PDATE Address 
router.put('/:id', authenticate, async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    const { fullName, phone, address, district, city, province, postalCode, isDefault } = req.body;

    const db = await getDB();
    const index = db.data.addresses.findIndex(a => a.id === addressId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่' });
    }

    if (db.data.addresses[index].userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์' });
    }


    if (isDefault) {
      db.data.addresses.forEach(a => {
        if (a.userId === req.user.id) a.isDefault = false;
      });
    }

    db.data.addresses[index] = {
      ...db.data.addresses[index],
      fullName: fullName || db.data.addresses[index].fullName,
      phone: phone || db.data.addresses[index].phone,
      address: address || db.data.addresses[index].address,
      district: district !== undefined ? district : db.data.addresses[index].district,
      city: city || db.data.addresses[index].city,
      province: province !== undefined ? province : db.data.addresses[index].province,
      postalCode: postalCode !== undefined ? postalCode : db.data.addresses[index].postalCode,
      isDefault: isDefault !== undefined ? isDefault : db.data.addresses[index].isDefault,
      updatedAt: new Date().toISOString()
    };

    await db.write();

    res.json({
      success: true,
      message: 'อัปเดตที่อยู่สำเร็จ',
      data: db.data.addresses[index]
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//DELETE Address 
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    const db = await getDB();
    const index = db.data.addresses.findIndex(a => a.id === addressId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่' });
    }

    if (db.data.addresses[index].userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์' });
    }

    db.data.addresses.splice(index, 1);
    await db.write();

    res.json({
      success: true,
      message: 'ลบที่อยู่สำเร็จ'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//ET DEFAULT Address 
router.put('/:id/default', authenticate, async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    const db = await getDB();
    const address = db.data.addresses.find(a => a.id === addressId);

    if (!address) {
      return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่' });
    }

    if (address.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์' });
    }

    
    db.data.addresses.forEach(a => {
      if (a.userId === req.user.id) a.isDefault = false;
    });

    address.isDefault = true;
    await db.write();

    res.json({
      success: true,
      message: 'ตั้งค่าที่อยู่หลักสำเร็จ',
      data: address
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;