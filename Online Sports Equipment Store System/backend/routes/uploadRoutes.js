const express = require('express');
const router = express.Router();
const { getDB } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

// ============ อัปโหลดสลิป ============
router.post('/slip/:orderId', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { slipImage } = req.body; // base64 หรือ URL

    if (!slipImage) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณาแนบสลิปการโอนเงิน' 
      });
    }

    const db = await getDB();
    const order = db.data.orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำสั่งซื้อ' 
      });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'ไม่มีสิทธิ์อัปโหลดสลิปนี้' 
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถอัปโหลดสลิปสำหรับคำสั่งซื้อที่ยกเลิกแล้ว' 
      });
    }

    order.slipImage = slipImage;
    order.paymentConfirmed = false;
    order.updatedAt = new Date().toISOString();
    await db.write();

    res.json({
      success: true,
      message: 'อัปโหลดสลิปสำเร็จ รอการตรวจสอบจากแอดมิน',
      data: { slipImage: order.slipImage }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ Admin ยืนยันการโอน ============
router.put('/confirm/:orderId', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // ตรวจสอบว่าเป็น Admin
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ 
        success: false, 
        error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่ยืนยันการโอนได้' 
      });
    }

    const db = await getDB();
    const order = db.data.orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำสั่งซื้อ' 
      });
    }

    if (!order.slipImage) {
      return res.status(400).json({ 
        success: false, 
        error: 'ยังไม่มีสลิปการโอนให้ยืนยัน' 
      });
    }

    if (order.paymentConfirmed) {
      return res.status(400).json({ 
        success: false, 
        error: 'คำสั่งซื้อนี้ได้รับการยืนยันแล้ว' 
      });
    }

    order.paymentConfirmed = true;
    order.status = 'processing';
    order.confirmedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    await db.write();

    res.json({
      success: true,
      message: 'ยืนยันการโอนเงินสำเร็จ',
      data: { 
        status: order.status,
        paymentConfirmed: order.paymentConfirmed,
        confirmedAt: order.confirmedAt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;