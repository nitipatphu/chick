const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

router.post('/slip/:orderId', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { slipImage } = req.body;

    if (slipImage === undefined || slipImage === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณาแนบสลิปการโอนเงิน' 
      });
    }

    const db = await getDB();
    const order = db.data.orders.find((o) => o.id === orderId);

    if (order === undefined) {
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

router.put('/confirm/:orderId', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (req.user.role !== 'administrator') {
      return res.status(403).json({ 
        success: false, 
        error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่ยืนยันการโอนได้' 
      });
    }

    const db = await getDB();
    const order = db.data.orders.find((o) => o.id === orderId);

    if (order === undefined) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำสั่งซื้อ' 
      });
    }

    if (order.slipImage === undefined || order.slipImage === null) {
      return res.status(400).json({ 
        success: false, 
        error: 'ยังไม่มีสลิปการโอนให้ยืนยัน' 
      });
    }

    if (order.paymentConfirmed === true) {
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

router.put('/reject/:orderId', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (req.user.role !== 'administrator') {
      return res.status(403).json({ 
        success: false, 
        error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่ปฏิเสธสลิปได้' 
      });
    }

    const db = await getDB();
    const order = db.data.orders.find((o) => o.id === orderId);

    if (order === undefined) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำสั่งซื้อ' 
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว' 
      });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถยกเลิกคำสั่งซื้อที่จัดส่งแล้วได้' 
      });
    }

    const items = [];
    for (let i = 0; i < db.data.orderItems.length; i++) {
        if (db.data.orderItems[i].orderId === orderId) {
            items.push(db.data.orderItems[i]);
        }
    }
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = db.data.products.find((p) => p.id === item.productId);
      if (product !== undefined) {
        product.stock = product.stock + item.quantity;
        db.data.inventoryLogs.push({
          id: generateId(),
          productId: item.productId,
          change: item.quantity,
          reason: 'ปฏิเสธสลิปและยกเลิกคำสั่งซื้อ #' + orderId + ' (โดยผู้ดูแลระบบ)',
          timestamp: new Date().toISOString(),
          updatedBy: req.user.username
        });
      }
    }

    order.status = 'cancelled';
    order.slipImage = null;
    order.paymentConfirmed = false;
    order.confirmedAt = null;
    order.updatedAt = new Date().toISOString();
    await db.write();

    res.json({
      success: true,
      message: 'ปฏิเสธสลิปและยกเลิกคำสั่งซื้อสำเร็จ',
      data: { 
        status: order.status,
        paymentConfirmed: order.paymentConfirmed
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;