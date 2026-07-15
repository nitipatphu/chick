const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

// GET Inventory (Staff/Admin) 
router.get('/', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const db = await getDB();
    const inventory = db.data.products.map(product => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      category: db.data.categories.find(c => c.id === product.categoryId)?.name || 'อื่นๆ',
      categoryId: product.categoryId,
      price: product.price,
      lastUpdated: product.updatedAt || product.createdAt,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      colors: product.colors || [],
      colorImages: product.colorImages || {},
      sizes: product.sizes || [],
      details: product.details || {}
    }));

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Inventory Logs (Staff/Admin)
router.get('/logs', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const db = await getDB();
    const logs = db.data.inventoryLogs || [];
    
    const logsWithNames = logs.map(log => {
      const product = db.data.products.find(p => p.id === log.productId);
      return {
        ...log,
        productName: product ? product.name : 'สินค้าถูกลบไปแล้ว'
      };
    });

    logsWithNames.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(logsWithNames);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Single Product 
router.get('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const db = await getDB();
    const product = db.data.products.find(p => p.id === productId);

    if (!product) {
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

// UPDATE Product (Staff/Admin) 
router.put('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { 
      name, description, price, categoryId, imageUrl, 
      colors, colorImages, sizes, details, stock 
    } = req.body;

    const db = await getDB();
    const index = db.data.products.findIndex(p => p.id === productId);

    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    const currentProduct = db.data.products[index];

   
    if (categoryId) {
      const categoryExists = db.data.categories.find(c => c.id === parseInt(categoryId));
      if (!categoryExists) {
        return res.status(400).json({ 
          success: false, 
          error: 'ไม่พบหมวดหมู่ที่เลือก' 
        });
      }
    }

    const updatedProduct = {
      id: currentProduct.id,
      name: name || currentProduct.name,
      description: description !== undefined ? description : currentProduct.description,
      price: price !== undefined ? parseFloat(price) : currentProduct.price,
      categoryId: categoryId !== undefined ? parseInt(categoryId) : currentProduct.categoryId,
      stock: stock !== undefined ? parseInt(stock) : currentProduct.stock,
      imageUrl: imageUrl !== undefined ? imageUrl : currentProduct.imageUrl,
      colors: colors !== undefined ? colors : currentProduct.colors || [],
      colorImages: colorImages !== undefined ? colorImages : currentProduct.colorImages || {},
      sizes: sizes !== undefined ? sizes : currentProduct.sizes || [],
      details: details !== undefined ? details : currentProduct.details || { material: '', features: '', usage: '' },
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
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตสินค้า' 
    });
  }
});

//  CREATE Product (Staff/Admin) 
router.post('/', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  try {
    const { 
      name, description, price, categoryId, stock, imageUrl, 
      colors, colorImages, sizes, details 
    } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน (name, price, categoryId)' 
      });
    }

    const db = await getDB();
    
    const categoryExists = db.data.categories.find(c => c.id === parseInt(categoryId));
    if (!categoryExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'ไม่พบหมวดหมู่ที่เลือก' 
      });
    }

    const newProduct = {
      id: generateId(),
      name,
      description: description || '',
      price: parseFloat(price),
      categoryId: parseInt(categoryId),
      stock: stock || 0,
      imageUrl: imageUrl || '',
      colors: colors || [],
      colorImages: colorImages || {},
      sizes: sizes || [],
      details: details || { material: '', features: '', usage: '' },
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
    console.error('Create error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' 
    });
  }
});

// DELETE Product (Admin Only) 
router.delete('/:id', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const db = await getDB();
    
    const index = db.data.products.findIndex(p => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบสินค้า' 
      });
    }

    const deletedProduct = db.data.products[index];

    db.data.orderItems = db.data.orderItems?.filter(item => item.productId !== productId) || [];
    db.data.inventoryLogs = db.data.inventoryLogs?.filter(log => log.productId !== productId) || [];

    db.data.products.splice(index, 1);
    await db.write();

    res.json({
      success: true,
      message: `ลบสินค้า "${deletedProduct.name}" สำเร็จ`,
      data: {
        id: deletedProduct.id,
        name: deletedProduct.name
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการลบสินค้า' 
    });
  }
});

// UPDATE Stock (Staff/Admin)
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
    const product = db.data.products.find(p => p.id === productId);

    if (!product) {
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
      if (!db.data.inventoryLogs) db.data.inventoryLogs = [];
      db.data.inventoryLogs.push({
        id: generateId(),
        productId: productId,
        change: change,
        reason: reason || `ปรับสต็อกจาก ${oldStock} เป็น ${stock}`,
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
        oldStock,
        newStock: product.stock,
        change
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตสต็อก' 
    });
  }
});

module.exports = router;