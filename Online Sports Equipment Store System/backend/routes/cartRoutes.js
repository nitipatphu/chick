const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

// GET Cart 
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const cartItems = db.data.cart.filter(item => item.userId === req.user.id);
    
    const cartWithProducts = cartItems.map(item => {
      const product = db.data.products.find(p => p.id === item.productId);
      return { 
        ...item, 
        product,
        selectedColor: item.color || '',
        selectedSize: item.size || ''
      };
    });
    
    res.json(cartWithProducts);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADD to Cart
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, quantity, color, size, price, name, image } = req.body;
    
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณาระบุสินค้าและจำนวนให้ถูกต้อง' 
      });
    }

    const db = await getDB();
    
    const product = db.data.products.find(p => p.id === parseInt(productId));
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: `สินค้า ${product.name} เหลือในสต็อก ${product.stock} ชิ้น` 
      });
    }

    const existingItem = db.data.cart.find(
      item => item.userId === req.user.id && 
              item.productId === parseInt(productId) &&
              item.color === color &&
              item.size === size
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          success: false, 
          error: `สินค้า ${product.name} เหลือในสต็อก ${product.stock} ชิ้น` 
        });
      }
      existingItem.quantity = newQuantity;
      existingItem.updatedAt = new Date().toISOString();
    } else {
      db.data.cart.push({
        id: generateId(),
        userId: req.user.id,
        productId: parseInt(productId),
        quantity: quantity,
        color: color || '',
        size: size || '',
        price: price || product.price,
        name: name || product.name,
        image: image || product.imageUrl,
        addedAt: new Date().toISOString()
      });
    }

    await db.write();

    res.json({
      success: true,
      message: 'เพิ่มสินค้าลงตะกร้าเรียบร้อย'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE Cart Item 
router.put('/:id', authenticate, async (req, res) => {
  try {
    const cartId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'จำนวนต้องมากกว่า 0' 
      });
    }

    const db = await getDB();
    const cartItem = db.data.cart.find(item => item.id === cartId);

    if (!cartItem) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้าในตะกร้า' 
      });
    }

    if (cartItem.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'คุณไม่มีสิทธิ์แก้ไขสินค้านี้' 
      });
    }

    const product = db.data.products.find(p => p.id === cartItem.productId);
    if (product && product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: `สินค้า ${product.name} เหลือในสต็อก ${product.stock} ชิ้น` 
      });
    }

    cartItem.quantity = quantity;
    cartItem.updatedAt = new Date().toISOString();
    await db.write();

    res.json({
      success: true,
      message: 'อัปเดตจำนวนสินค้าเรียบร้อย'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// REMOVE from Cart 
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const cartId = parseInt(req.params.id);
    const db = await getDB();
    
    const index = db.data.cart.findIndex(item => item.id === cartId);
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้าในตะกร้า' 
      });
    }

    const cartItem = db.data.cart[index];
    if (cartItem.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'คุณไม่มีสิทธิ์ลบสินค้านี้' 
      });
    }

    db.data.cart.splice(index, 1);
    await db.write();

    res.json({
      success: true,
      message: 'ลบสินค้าออกจากตะกร้าเรียบร้อย'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CLEAR Cart
router.delete('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    db.data.cart = db.data.cart.filter(item => item.userId !== req.user.id);
    await db.write();

    res.json({
      success: true,
      message: 'ล้างตะกร้าสินค้าเรียบร้อย'
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;