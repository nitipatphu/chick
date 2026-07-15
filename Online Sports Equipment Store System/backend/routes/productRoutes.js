const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

// GET Products (Public) 
router.get('/', async (req, res) => {
  const db = await getDB();
  let products = db.data.products;

  if (req.query.categoryId) {
    products = products.filter(p => p.categoryId === parseInt(req.query.categoryId));
  }

  if (req.query.q) {
    const query = req.query.q.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
  }

  res.json(products);
});

// Removed GET /categories as it's now in categoryRoutes.js

//  GET Product by ID
router.get('/:id', async (req, res) => {
  const db = await getDB();
  const product = db.data.products.find(p => p.id === parseInt(req.params.id));

  if (!product) {
    return res.status(404).json({ 
      success: false, 
      error: 'ไม่พบสินค้า' 
    });
  }

  res.json(product);
});

// CREATE Product (Staff + Admin)
router.post('/', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  const { name, description, price, categoryId, stock, imageUrl, colors, colorImages, sizes } = req.body;

  if (!name || !price || !categoryId) {
    return res.status(400).json({ 
      success: false, 
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน (name, price, categoryId)' 
    });
  }

  const db = await getDB();
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
    createdAt: new Date().toISOString().split('T')[0]
  };

  db.data.products.push(newProduct);
  await db.write();

  res.status(201).json({
    success: true,
    message: 'เพิ่มสินค้าสำเร็จ',
    product: newProduct
  });
});

//  UPDATE Product (Staff + Admin)
router.put('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  const productId = parseInt(req.params.id);
  const db = await getDB();
  
  const index = db.data.products.findIndex(p => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'ไม่พบสินค้า' 
    });
  }

  const updatedProduct = {
    ...db.data.products[index],
    ...req.body,
    id: productId,
    price: req.body.price ? parseFloat(req.body.price) : db.data.products[index].price,
    categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : db.data.products[index].categoryId,
    stock: req.body.stock !== undefined ? parseInt(req.body.stock) : db.data.products[index].stock,
    colors: req.body.colors || db.data.products[index].colors || [],
    colorImages: req.body.colorImages || db.data.products[index].colorImages || {},
    sizes: req.body.sizes || db.data.products[index].sizes || [],
    updatedAt: new Date().toISOString()
  };

  db.data.products[index] = updatedProduct;
  await db.write();

  res.json({
    success: true,
    message: 'อัปเดตสินค้าสำเร็จ',
    product: updatedProduct
  });
});

//  DELETE Product (Admin Only)
router.delete('/:id', authenticate, authorize('administrator'), async (req, res) => {
  const productId = parseInt(req.params.id);
  const db = await getDB();
  
  const index = db.data.products.findIndex(p => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'ไม่พบสินค้า' 
    });
  }

  db.data.products.splice(index, 1);
  await db.write();

  res.json({
    success: true,
    message: 'ลบสินค้าสำเร็จ'
  });
});

// GET Categories 
router.get('/categories', async (req, res) => {
  const db = await getDB();
  res.json(db.data.categories);
});

module.exports = router;