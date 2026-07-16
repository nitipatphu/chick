const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const cartItems = db.data.cart.filter((item) => item.userId === req.user.id);
    
    const cartWithProducts = [];
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const product = db.data.products.find((p) => p.id === item.productId);
      
      let color = item.color;
      if (color === undefined) {
          color = '';
      }
      
      let size = item.size;
      if (size === undefined) {
          size = '';
      }
      
      cartWithProducts.push({
        id: item.id,
        userId: item.userId,
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        price: item.price,
        name: item.name,
        image: item.image,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
        product: product,
        selectedColor: color,
        selectedSize: size
      });
    }
    
    res.json(cartWithProducts);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, quantity, color, size, price, name, image } = req.body;
    
    if (productId === undefined || quantity === undefined || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณาระบุสินค้าและจำนวนให้ถูกต้อง' 
      });
    }

    if (req.user.role === 'staff' || req.user.role === 'administrator') {
      return res.status(403).json({
        success: false,
        error: 'บัญชีผู้ดูแลระบบหรือพนักงานไม่สามารถสั่งซื้อสินค้าได้'
      });
    }

    const db = await getDB();
    
    const product = db.data.products.find((p) => p.id === parseInt(productId));
    if (product === undefined) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'สินค้า ' + product.name + ' เหลือในสต็อก ' + product.stock + ' ชิ้น' 
      });
    }

    let existingItem = undefined;
    for (let i = 0; i < db.data.cart.length; i++) {
      const item = db.data.cart[i];
      if (item.userId === req.user.id && item.productId === parseInt(productId) && item.color === color && item.size === size) {
        existingItem = item;
      }
    }

    if (existingItem !== undefined) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ 
          success: false, 
          error: 'สินค้า ' + product.name + ' เหลือในสต็อก ' + product.stock + ' ชิ้น' 
        });
      }
      existingItem.quantity = newQuantity;
      existingItem.updatedAt = new Date().toISOString();
    } else {
      let finalColor = color;
      if (finalColor === undefined) finalColor = '';
      
      let finalSize = size;
      if (finalSize === undefined) finalSize = '';
      
      let finalPrice = price;
      if (finalPrice === undefined) finalPrice = product.price;
      
      let finalName = name;
      if (finalName === undefined) finalName = product.name;
      
      let finalImage = image;
      if (finalImage === undefined) finalImage = product.imageUrl;

      db.data.cart.push({
        id: generateId(),
        userId: req.user.id,
        productId: parseInt(productId),
        quantity: quantity,
        color: finalColor,
        size: finalSize,
        price: finalPrice,
        name: finalName,
        image: finalImage,
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

router.put('/:id', authenticate, async (req, res) => {
  try {
    const cartId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'จำนวนต้องมากกว่า 0' 
      });
    }

    const db = await getDB();
    const cartItem = db.data.cart.find((item) => item.id === cartId);

    if (cartItem === undefined) {
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

    const product = db.data.products.find((p) => p.id === cartItem.productId);
    if (product !== undefined && product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'สินค้า ' + product.name + ' เหลือในสต็อก ' + product.stock + ' ชิ้น' 
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

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const cartId = parseInt(req.params.id);
    const db = await getDB();
    
    const index = db.data.cart.findIndex((item) => item.id === cartId);
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

router.delete('/', authenticate, async (req, res) => {
  try {
    const db = await getDB();
    const newCart = [];
    for (let i = 0; i < db.data.cart.length; i++) {
        const item = db.data.cart[i];
        if (item.userId !== req.user.id) {
            newCart.push(item);
        }
    }
    db.data.cart = newCart;
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