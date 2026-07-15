const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

//  GET Orders (User + Admin) 
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    let orders = db.data.orders || [];

    if (req.user.role === 'customer') {
      orders = orders.filter(order => order.userId === req.user.id);
    }

    const ordersWithDetails = orders.map(order => {
      const user = db.data.users.find(u => u.id === order.userId);
      const items = db.data.orderItems.filter(item => item.orderId === order.id);
      
      const itemsWithProduct = items.map(item => {
        const product = db.data.products.find(p => p.id === item.productId);
        return { ...item, product: product || null };
      });

      return { 
        ...order, 
        user: user ? { 
          id: user.id, 
          username: user.username, 
          fullName: user.fullName,
          email: user.email,
          phone: user.phone 
        } : null,
        items: itemsWithProduct 
      };
    });

    ordersWithDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(ordersWithDetails);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Order by ID 
router.get('/:id', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const db = await getDB();
    
    const order = db.data.orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำสั่งซื้อ' 
      });
    }

    if (req.user.role === 'customer' && order.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้' 
      });
    }

    const user = db.data.users.find(u => u.id === order.userId);
    const items = db.data.orderItems.filter(item => item.orderId === orderId);
    
    const itemsWithProduct = items.map(item => {
      const product = db.data.products.find(p => p.id === item.productId);
      return { ...item, product: product || null };
    });

    res.json({
      ...order,
      user: user ? { 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName,
        email: user.email,
        phone: user.phone 
      } : null,
      items: itemsWithProduct
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE Order Status (Admin + Staff)
router.put('/:id/status', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, trackingCourier, trackingNumber } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `สถานะไม่ถูกต้อง ต้องเป็น: ${validStatuses.join(', ')}` 
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

    if (status === 'cancelled' && order.status === 'delivered') {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถยกเลิกคำสั่งซื้อที่จัดส่งแล้วได้' 
      });
    }

    
    if ((status === 'cancelled' || status === 'returned') && order.status !== 'cancelled' && order.status !== 'returned') {
      const items = db.data.orderItems.filter(item => item.orderId === orderId);
      for (const item of items) {
        const product = db.data.products.find(p => p.id === item.productId);
        if (product) {
          product.stock += item.quantity;
          const reasonText = status === 'returned' ? 'พัสดุตีกลับ' : 'ยกเลิกคำสั่งซื้อ (โดยผู้ดูแลระบบ)';
          db.data.inventoryLogs.push({
            id: generateId(),
            productId: item.productId,
            change: item.quantity,
            reason: `${reasonText} #${orderId}`,
            timestamp: new Date().toISOString(),
            updatedBy: req.user.username
          });
        }
      }
    }

    if (status === 'shipped') {
      order.trackingCourier = trackingCourier || null;
      order.trackingNumber = trackingNumber || null;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    await db.write();

    res.json({
      success: true,
      message: `อัปเดตสถานะคำสั่งซื้อเป็น "${status}" สำเร็จ`,
      order
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CANCEL Order (Customer)
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
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
        error: 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้' 
      });
    }

    const isCOD = order.paymentMethod === 'cod';
    if (isCOD) {
      if (order.status !== 'pending' && order.status !== 'processing') {
        return res.status(400).json({ 
          success: false, 
          error: 'คำสั่งซื้อแบบเก็บเงินปลายทางสามารถยกเลิกได้เฉพาะตอนรอดำเนินการหรือกำลังเตรียมจัดส่งเท่านั้น' 
        });
      }
    } else {
      if (order.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          error: 'สามารถยกเลิกได้เฉพาะคำสั่งซื้อที่อยู่ระหว่างรอดำเนินการเท่านั้น (หากเตรียมจัดส่งหรือจัดส่งแล้วจะไม่สามารถยกเลิกได้)' 
        });
      }
    }

    
    const items = db.data.orderItems.filter(item => item.orderId === orderId);
    for (const item of items) {
      const product = db.data.products.find(p => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
        db.data.inventoryLogs.push({
          id: generateId(),
          productId: item.productId,
          change: item.quantity,
          reason: `ลูกค้ายกเลิกคำสั่งซื้อ #${orderId}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    await db.write();

    res.json({
      success: true,
      message: 'ยกเลิกคำสั่งซื้อสำเร็จ',
      order
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//  CREATE Order (Checkout) 
router.post('/', authenticate, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, note } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกที่อยู่จัดส่ง' 
      });
    }

    const db = await getDB();
    const cartItems = db.data.cart.filter(item => item.userId === req.user.id);

    if (cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ตะกร้าสินค้าของคุณว่างเปล่า' 
      });
    }

  
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const product = db.data.products.find(p => p.id === item.productId);
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          error: `ไม่พบสินค้า ID ${item.productId}` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `สินค้า ${product.name} เหลือในสต็อก ${product.stock} ชิ้น` 
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        id: generateId(),
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        color: item.color || null,
        size: item.size || null
      });
    }

    
    const newOrder = {
      id: generateId(),
      userId: req.user.id,
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: totalAmount,
      status: 'pending',
      shippingAddress,
      paymentMethod: paymentMethod || 'bank_transfer',
      fullName: req.body.fullName || '',
      phone: req.body.phone || '',
      note: note || '',
      slipImage: null,
      paymentConfirmed: false,
      confirmedAt: null,
      createdAt: new Date().toISOString()
    };

    db.data.orders.push(newOrder);

    
    for (const item of orderItems) {
      db.data.orderItems.push({
        ...item,
        orderId: newOrder.id
      });
    }

    
    for (const item of cartItems) {
      const product = db.data.products.find(p => p.id === item.productId);
      product.stock -= item.quantity;

      db.data.inventoryLogs.push({
        id: generateId(),
        productId: item.productId,
        change: -item.quantity,
        reason: `คำสั่งซื้อ #${newOrder.id}`,
        timestamp: new Date().toISOString()
      });
    }

  
    db.data.cart = db.data.cart.filter(item => item.userId !== req.user.id);
    
    await db.write();

    const orderWithItems = {
      ...newOrder,
      items: orderItems.map(item => ({
        ...item,
        product: db.data.products.find(p => p.id === item.productId)
      }))
    };

    res.status(201).json({
      success: true,
      message: 'สั่งซื้อสำเร็จ',
      orderId: newOrder.id,
      order: orderWithItems
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;