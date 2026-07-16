const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const addresses = db.data.addresses.filter((a) => a.userId === req.user.id);
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const address = db.data.addresses.find((a) => a.id === parseInt(req.params.id));
    
    if (address === undefined) {
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

router.post('/', authenticate, async (req, res) => {
  try {
    const { fullName, phone, address, district, city, province, postalCode, isDefault } = req.body;

    if (fullName === undefined || fullName === '' || phone === undefined || phone === '' || address === undefined || address === '' || city === undefined || city === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, เบอร์โทร, ที่อยู่, อำเภอ)' 
      });
    }

    const db = await getDB();

    if (isDefault === true) {
      for (let i = 0; i < db.data.addresses.length; i++) {
        const a = db.data.addresses[i];
        if (a.userId === req.user.id) {
          a.isDefault = false;
        }
      }
    }

    let districtValue = district;
    if (districtValue === undefined) {
        districtValue = '';
    }

    let provinceValue = province;
    if (provinceValue === undefined) {
        provinceValue = '';
    }

    let postalCodeValue = postalCode;
    if (postalCodeValue === undefined) {
        postalCodeValue = '';
    }

    let isDefaultValue = isDefault;
    if (isDefaultValue === undefined) {
        isDefaultValue = false;
    }

    const newAddress = {
      id: generateId(),
      userId: req.user.id,
      fullName: fullName,
      phone: phone,
      address: address,
      district: districtValue,
      city: city,
      province: provinceValue,
      postalCode: postalCodeValue,
      isDefault: isDefaultValue,
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

router.put('/:id', authenticate, async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    const { fullName, phone, address, district, city, province, postalCode, isDefault } = req.body;

    const db = await getDB();
    const index = db.data.addresses.findIndex((a) => a.id === addressId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่' });
    }

    if (db.data.addresses[index].userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์' });
    }

    if (isDefault === true) {
      for (let i = 0; i < db.data.addresses.length; i++) {
        const a = db.data.addresses[i];
        if (a.userId === req.user.id) {
          a.isDefault = false;
        }
      }
    }

    const oldAddress = db.data.addresses[index];
    
    let updatedFullName = fullName;
    if (updatedFullName === undefined) updatedFullName = oldAddress.fullName;
    
    let updatedPhone = phone;
    if (updatedPhone === undefined) updatedPhone = oldAddress.phone;
    
    let updatedAddress = address;
    if (updatedAddress === undefined) updatedAddress = oldAddress.address;
    
    let updatedDistrict = district;
    if (updatedDistrict === undefined) updatedDistrict = oldAddress.district;
    
    let updatedCity = city;
    if (updatedCity === undefined) updatedCity = oldAddress.city;
    
    let updatedProvince = province;
    if (updatedProvince === undefined) updatedProvince = oldAddress.province;
    
    let updatedPostalCode = postalCode;
    if (updatedPostalCode === undefined) updatedPostalCode = oldAddress.postalCode;
    
    let updatedIsDefault = isDefault;
    if (updatedIsDefault === undefined) updatedIsDefault = oldAddress.isDefault;

    db.data.addresses[index] = {
      id: oldAddress.id,
      userId: oldAddress.userId,
      createdAt: oldAddress.createdAt,
      fullName: updatedFullName,
      phone: updatedPhone,
      address: updatedAddress,
      district: updatedDistrict,
      city: updatedCity,
      province: updatedProvince,
      postalCode: updatedPostalCode,
      isDefault: updatedIsDefault,
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

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    const db = await getDB();
    const index = db.data.addresses.findIndex((a) => a.id === addressId);

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

router.put('/:id/default', authenticate, async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    const db = await getDB();
    const address = db.data.addresses.find((a) => a.id === addressId);

    if (address === undefined) {
      return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่' });
    }

    if (address.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'ไม่มีสิทธิ์' });
    }

    for (let i = 0; i < db.data.addresses.length; i++) {
        const a = db.data.addresses[i];
        if (a.userId === req.user.id) {
            a.isDefault = false;
        }
    }

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