const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    let orders = db.data.orders;
    if (orders === undefined) orders = [];

    const userOrders = [];
    if (req.user.role === 'customer') {
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].userId === req.user.id) {
          userOrders.push(orders[i]);
        }
      }
      orders = userOrders;
    }

    const ordersWithDetails = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const user = db.data.users.find((u) => u.id === order.userId);
      
      const items = [];
      for (let j = 0; j < db.data.orderItems.length; j++) {
        if (db.data.orderItems[j].orderId === order.id) {
          items.push(db.data.orderItems[j]);
        }
      }
      
      const itemsWithProduct = [];
      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        const product = db.data.products.find((p) => p.id === item.productId);
        
        let foundProduct = product;
        if (foundProduct === undefined) foundProduct = null;

        itemsWithProduct.push({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
          size: item.size,
          product: foundProduct
        });
      }

      let userDetails = null;
      if (user !== undefined) {
        userDetails = {
          id: user.id, 
          username: user.username, 
          fullName: user.fullName,
          email: user.email,
          phone: user.phone 
        };
      }

      ordersWithDetails.push({
        id: order.id,
        userId: order.userId,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        fullName: order.fullName,
        phone: order.phone,
        note: order.note,
        slipImage: order.slipImage,
        paymentConfirmed: order.paymentConfirmed,
        confirmedAt: order.confirmedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        trackingCourier: order.trackingCourier,
        trackingNumber: order.trackingNumber,
        user: userDetails,
        items: itemsWithProduct 
      });
    }

    ordersWithDetails.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
    });

    res.json(ordersWithDetails);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const db = await getDB();
    
    const order = db.data.orders.find((o) => o.id === orderId);
    if (order === undefined) {
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

    const user = db.data.users.find((u) => u.id === order.userId);
    
    const items = [];
    for (let i = 0; i < db.data.orderItems.length; i++) {
        if (db.data.orderItems[i].orderId === orderId) {
            items.push(db.data.orderItems[i]);
        }
    }
    
    const itemsWithProduct = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const product = db.data.products.find((p) => p.id === item.productId);
        
        let foundProduct = product;
        if (foundProduct === undefined) foundProduct = null;

        itemsWithProduct.push({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            color: item.color,
            size: item.size,
            product: foundProduct
        });
    }

    let userDetails = null;
    if (user !== undefined) {
        userDetails = {
            id: user.id, 
            username: user.username, 
            fullName: user.fullName,
            email: user.email,
            phone: user.phone 
        };
    }

    res.json({
      id: order.id,
      userId: order.userId,
      orderDate: order.orderDate,
      totalAmount: order.totalAmount,
      status: order.status,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      fullName: order.fullName,
      phone: order.phone,
      note: order.note,
      slipImage: order.slipImage,
      paymentConfirmed: order.paymentConfirmed,
      confirmedAt: order.confirmedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      trackingCourier: order.trackingCourier,
      trackingNumber: order.trackingNumber,
      user: userDetails,
      items: itemsWithProduct
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/status', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, trackingCourier, trackingNumber } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    
    let isValidStatus = false;
    for (let i = 0; i < validStatuses.length; i++) {
        if (status === validStatuses[i]) {
            isValidStatus = true;
        }
    }

    if (status === undefined || isValidStatus === false) {
      return res.status(400).json({ 
        success: false, 
        error: 'สถานะไม่ถูกต้อง' 
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

    if (status === 'cancelled' && order.status === 'delivered') {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่สามารถยกเลิกคำสั่งซื้อที่จัดส่งแล้วได้' 
      });
    }

    if ((status === 'cancelled' || status === 'returned') && order.status !== 'cancelled' && order.status !== 'returned') {
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
          
          let reasonText = 'ยกเลิกคำสั่งซื้อ (โดยผู้ดูแลระบบ)';
          if (status === 'returned') {
              reasonText = 'พัสดุตีกลับ';
          }
          
          db.data.inventoryLogs.push({
            id: generateId(),
            productId: item.productId,
            change: item.quantity,
            reason: reasonText + ' #' + orderId,
            timestamp: new Date().toISOString(),
            updatedBy: req.user.username
          });
        }
      }
    }

    if (status === 'shipped') {
      if (trackingCourier !== undefined) {
          order.trackingCourier = trackingCourier;
      } else {
          order.trackingCourier = null;
      }
      
      if (trackingNumber !== undefined) {
          order.trackingNumber = trackingNumber;
      } else {
          order.trackingNumber = null;
      }
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    await db.write();

    res.json({
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ',
      order: order
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
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
        error: 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้' 
      });
    }

    if (order.paymentMethod === 'cod') {
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
          reason: 'ลูกค้ายกเลิกคำสั่งซื้อ #' + orderId,
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
      order: order
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, note, fullName, phone } = req.body;

    if (shippingAddress === undefined || shippingAddress === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกที่อยู่จัดส่ง' 
      });
    }

    const db = await getDB();
    const cartItems = [];
    for (let i = 0; i < db.data.cart.length; i++) {
        if (db.data.cart[i].userId === req.user.id) {
            cartItems.push(db.data.cart[i]);
        }
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'ตะกร้าสินค้าของคุณว่างเปล่า' 
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const product = db.data.products.find((p) => p.id === item.productId);
      
      if (product === undefined) {
        return res.status(404).json({ 
          success: false, 
          error: 'ไม่พบสินค้า ID ' + item.productId 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: 'สินค้า ' + product.name + ' เหลือในสต็อก ' + product.stock + ' ชิ้น' 
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount = totalAmount + subtotal;

      let itemColor = item.color;
      if (itemColor === undefined) itemColor = null;

      let itemSize = item.size;
      if (itemSize === undefined) itemSize = null;

      orderItems.push({
        id: generateId(),
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        color: itemColor,
        size: itemSize
      });
    }

    let finalPaymentMethod = paymentMethod;
    if (finalPaymentMethod === undefined) finalPaymentMethod = 'bank_transfer';

    let finalFullName = fullName;
    if (finalFullName === undefined) finalFullName = '';

    let finalPhone = phone;
    if (finalPhone === undefined) finalPhone = '';

    let finalNote = note;
    if (finalNote === undefined) finalNote = '';

    const newOrder = {
      id: generateId(),
      userId: req.user.id,
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: totalAmount,
      status: 'pending',
      shippingAddress: shippingAddress,
      paymentMethod: finalPaymentMethod,
      fullName: finalFullName,
      phone: finalPhone,
      note: finalNote,
      slipImage: null,
      paymentConfirmed: false,
      confirmedAt: null,
      createdAt: new Date().toISOString()
    };

    db.data.orders.push(newOrder);

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      db.data.orderItems.push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
        size: item.size,
        orderId: newOrder.id
      });
    }

    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const product = db.data.products.find((p) => p.id === item.productId);
      product.stock = product.stock - item.quantity;

      db.data.inventoryLogs.push({
        id: generateId(),
        productId: item.productId,
        change: -item.quantity,
        reason: 'คำสั่งซื้อ #' + newOrder.id,
        timestamp: new Date().toISOString()
      });
    }

    const newCart = [];
    for (let i = 0; i < db.data.cart.length; i++) {
        if (db.data.cart[i].userId !== req.user.id) {
            newCart.push(db.data.cart[i]);
        }
    }
    db.data.cart = newCart;
    
    await db.write();

    const orderWithItems = {
      id: newOrder.id,
      userId: newOrder.userId,
      orderDate: newOrder.orderDate,
      totalAmount: newOrder.totalAmount,
      status: newOrder.status,
      shippingAddress: newOrder.shippingAddress,
      paymentMethod: newOrder.paymentMethod,
      fullName: newOrder.fullName,
      phone: newOrder.phone,
      note: newOrder.note,
      slipImage: newOrder.slipImage,
      paymentConfirmed: newOrder.paymentConfirmed,
      confirmedAt: newOrder.confirmedAt,
      createdAt: newOrder.createdAt,
      items: []
    };

    for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i];
        const product = db.data.products.find((p) => p.id === item.productId);
        orderWithItems.items.push({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            color: item.color,
            size: item.size,
            product: product
        });
    }

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