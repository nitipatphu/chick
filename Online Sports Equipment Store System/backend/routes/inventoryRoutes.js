const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const db = await getDB();
    const inventory = [];
    
    for (let i = 0; i < db.data.products.length; i++) {
      const product = db.data.products[i];
      let categoryName = 'อื่นๆ';
      const category = db.data.categories.find((c) => c.id === product.categoryId);
      if (category !== undefined) {
          categoryName = category.name;
      }

      let lastUpdated = product.updatedAt;
      if (lastUpdated === undefined || lastUpdated === null) {
          lastUpdated = product.createdAt;
      }

      let description = product.description;
      if (description === undefined) description = '';

      let imageUrl = product.imageUrl;
      if (imageUrl === undefined) imageUrl = '';

      let colors = product.colors;
      if (colors === undefined) colors = [];

      let colorImages = product.colorImages;
      if (colorImages === undefined) colorImages = {};

      let sizes = product.sizes;
      if (sizes === undefined) sizes = [];

      let details = product.details;
      if (details === undefined) details = {};

      inventory.push({
        id: product.id,
        name: product.name,
        stock: product.stock,
        category: categoryName,
        categoryId: product.categoryId,
        price: product.price,
        lastUpdated: lastUpdated,
        description: description,
        imageUrl: imageUrl,
        colors: colors,
        colorImages: colorImages,
        sizes: sizes,
        details: details
      });
    }

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/logs', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const db = await getDB();
    let logs = db.data.inventoryLogs;
    if (logs === undefined) {
        logs = [];
    }
    
    const logsWithNames = [];
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const product = db.data.products.find((p) => p.id === log.productId);
      
      let productName = 'สินค้าถูกลบไปแล้ว';
      if (product !== undefined) {
          productName = product.name;
      }
      
      logsWithNames.push({
        id: log.id,
        productId: log.productId,
        change: log.change,
        reason: log.reason,
        timestamp: log.timestamp,
        updatedBy: log.updatedBy,
        productName: productName
      });
    }

    logsWithNames.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
    });

    res.json(logsWithNames);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const db = await getDB();
    const product = db.data.products.find((p) => p.id === productId);

    if (product === undefined) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { 
      name, description, price, categoryId, imageUrl, 
      colors, colorImages, sizes, details, stock 
    } = req.body;

    const db = await getDB();
    const index = db.data.products.findIndex((p) => p.id === productId);

    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    const currentProduct = db.data.products[index];

    if (categoryId !== undefined) {
      const categoryExists = db.data.categories.find((c) => c.id === parseInt(categoryId));
      if (categoryExists === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'ไม่พบหมวดหมู่ที่เลือก' 
        });
      }
    }

    let newName = name;
    if (newName === undefined) newName = currentProduct.name;
    
    let newDescription = description;
    if (newDescription === undefined) newDescription = currentProduct.description;
    
    let newPrice = price;
    if (newPrice === undefined) {
        newPrice = currentProduct.price;
    } else {
        newPrice = parseFloat(newPrice);
    }
    
    let newCategoryId = categoryId;
    if (newCategoryId === undefined) {
        newCategoryId = currentProduct.categoryId;
    } else {
        newCategoryId = parseInt(newCategoryId);
    }
    
    let newStock = stock;
    if (newStock === undefined) {
        newStock = currentProduct.stock;
    } else {
        newStock = parseInt(newStock);
    }
    
    let newImageUrl = imageUrl;
    if (newImageUrl === undefined) newImageUrl = currentProduct.imageUrl;
    
    let newColors = colors;
    if (newColors === undefined) {
        newColors = currentProduct.colors;
        if (newColors === undefined) newColors = [];
    }
    
    let newColorImages = colorImages;
    if (newColorImages === undefined) {
        newColorImages = currentProduct.colorImages;
        if (newColorImages === undefined) newColorImages = {};
    }
    
    let newSizes = sizes;
    if (newSizes === undefined) {
        newSizes = currentProduct.sizes;
        if (newSizes === undefined) newSizes = [];
    }
    
    let newDetails = details;
    if (newDetails === undefined) {
        newDetails = currentProduct.details;
        if (newDetails === undefined) newDetails = { material: '', features: '', usage: '' };
    }

    const updatedProduct = {
      id: currentProduct.id,
      name: newName,
      description: newDescription,
      price: newPrice,
      categoryId: newCategoryId,
      stock: newStock,
      imageUrl: newImageUrl,
      colors: newColors,
      colorImages: newColorImages,
      sizes: newSizes,
      details: newDetails,
      createdAt: currentProduct.createdAt,
      updatedAt: new Date().toISOString()
    };

    db.data.products[index] = updatedProduct;
    await db.write();

    res.json({
      success: true,
      message: 'อัปเดตสินค้าสำเร็จ',
      product: updatedProduct
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const { 
      name, description, price, categoryId, stock, imageUrl, 
      colors, colorImages, sizes, details 
    } = req.body;

    if (name === undefined || name === '' || price === undefined || categoryId === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (name, price, categoryId)' 
      });
    }

    const db = await getDB();
    
    const categoryExists = db.data.categories.find((c) => c.id === parseInt(categoryId));
    if (categoryExists === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่พบหมวดหมู่ที่เลือก' 
      });
    }

    let finalDescription = description;
    if (finalDescription === undefined) finalDescription = '';
    
    let finalStock = stock;
    if (finalStock === undefined) finalStock = 0;
    
    let finalImageUrl = imageUrl;
    if (finalImageUrl === undefined) finalImageUrl = '';
    
    let finalColors = colors;
    if (finalColors === undefined) finalColors = [];
    
    let finalColorImages = colorImages;
    if (finalColorImages === undefined) finalColorImages = {};
    
    let finalSizes = sizes;
    if (finalSizes === undefined) finalSizes = [];
    
    let finalDetails = details;
    if (finalDetails === undefined) finalDetails = { material: '', features: '', usage: '' };

    const newProduct = {
      id: generateId(),
      name: name,
      description: finalDescription,
      price: parseFloat(price),
      categoryId: parseInt(categoryId),
      stock: finalStock,
      imageUrl: finalImageUrl,
      colors: finalColors,
      colorImages: finalColorImages,
      sizes: finalSizes,
      details: finalDetails,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: null
    };

    db.data.products.push(newProduct);
    await db.write();

    res.status(201).json({
      success: true,
      message: 'เพิ่มสินค้าสำเร็จ',
      product: newProduct
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.delete('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const db = await getDB();
    
    const index = db.data.products.findIndex((p) => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    const deletedProduct = db.data.products[index];

    const newOrderItems = [];
    if (db.data.orderItems !== undefined) {
        for (let i = 0; i < db.data.orderItems.length; i++) {
            if (db.data.orderItems[i].productId !== productId) {
                newOrderItems.push(db.data.orderItems[i]);
            }
        }
    }
    db.data.orderItems = newOrderItems;
    
    const newInventoryLogs = [];
    if (db.data.inventoryLogs !== undefined) {
        for (let i = 0; i < db.data.inventoryLogs.length; i++) {
            if (db.data.inventoryLogs[i].productId !== productId) {
                newInventoryLogs.push(db.data.inventoryLogs[i]);
            }
        }
    }
    db.data.inventoryLogs = newInventoryLogs;

    db.data.products.splice(index, 1);
    await db.write();

    res.json({
      success: true,
      message: 'ลบสินค้า ' + deletedProduct.name + ' สำเร็จ',
      data: {
        id: deletedProduct.id,
        name: deletedProduct.name
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.put('/:id/stock', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { stock, reason } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณาระบุจำนวนสต็อกให้ถูกต้อง (ต้อง >= 0)' 
      });
    }

    const db = await getDB();
    const product = db.data.products.find((p) => p.id === productId);

    if (product === undefined) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    const oldStock = product.stock;
    const change = stock - oldStock;

    product.stock = stock;
    product.updatedAt = new Date().toISOString();

    if (change !== 0) {
      if (db.data.inventoryLogs === undefined) {
          db.data.inventoryLogs = [];
      }
      
      let finalReason = reason;
      if (finalReason === undefined || finalReason === '') {
          finalReason = 'ปรับสต็อกจาก ' + oldStock + ' เป็น ' + stock;
      }
      
      db.data.inventoryLogs.push({
        id: generateId(),
        productId: productId,
        change: change,
        reason: finalReason,
        timestamp: new Date().toISOString(),
        updatedBy: req.user.username
      });
    }

    await db.write();

    res.json({
      success: true,
      message: 'อัปเดตสต็อกสำเร็จ',
      product: {
        id: product.id,
        name: product.name,
        oldStock: oldStock,
        newStock: product.stock,
        change: change
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;