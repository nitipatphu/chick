const express = require('express');
const router = express.Router();
const { getDB, generateId } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const db = await getDB();
  let products = db.data.products;

  if (req.query.categoryId !== undefined) {
    const newProducts = [];
    for (let i = 0; i < products.length; i++) {
        if (products[i].categoryId === parseInt(req.query.categoryId)) {
            newProducts.push(products[i]);
        }
    }
    products = newProducts;
  }

  if (req.query.q !== undefined) {
    const query = req.query.q.toLowerCase();
    const newProducts = [];
    for (let i = 0; i < products.length; i++) {
        const productName = products[i].name.toLowerCase();
        let productDesc = products[i].description;
        if (productDesc === undefined) {
            productDesc = '';
        }
        productDesc = productDesc.toLowerCase();

        if (productName.includes(query) === true || productDesc.includes(query) === true) {
            newProducts.push(products[i]);
        }
    }
    products = newProducts;
  }

  res.json(products);
});

router.get('/:id', async (req, res) => {
  const db = await getDB();
  const product = db.data.products.find((p) => p.id === parseInt(req.params.id));

  if (product === undefined) {
    return res.status(404).json({ 
      success: false, 
      error: 'ไม่พบสินค้า' 
    });
  }

  res.json(product);
});

router.post('/', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  const { name, description, price, categoryId, stock, imageUrl, colors, colorImages, sizes } = req.body;

  if (name === undefined || name === '' || price === undefined || categoryId === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน (name, price, categoryId)' 
    });
  }

  const db = await getDB();

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

router.put('/:id', authenticate, authorize('staff', 'administrator'), async (req, res) => {
  const productId = parseInt(req.params.id);
  const db = await getDB();
  
  const index = db.data.products.findIndex((p) => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'ไม่พบสินค้า' 
    });
  }

  const oldProduct = db.data.products[index];

  let newName = req.body.name;
  if (newName === undefined) newName = oldProduct.name;

  let newDescription = req.body.description;
  if (newDescription === undefined) newDescription = oldProduct.description;

  let newPrice = req.body.price;
  if (newPrice === undefined) {
      newPrice = oldProduct.price;
  } else {
      newPrice = parseFloat(newPrice);
  }

  let newCategoryId = req.body.categoryId;
  if (newCategoryId === undefined) {
      newCategoryId = oldProduct.categoryId;
  } else {
      newCategoryId = parseInt(newCategoryId);
  }

  let newStock = req.body.stock;
  if (newStock === undefined) {
      newStock = oldProduct.stock;
  } else {
      newStock = parseInt(newStock);
  }

  let newImageUrl = req.body.imageUrl;
  if (newImageUrl === undefined) newImageUrl = oldProduct.imageUrl;

  let newColors = req.body.colors;
  if (newColors === undefined) {
      newColors = oldProduct.colors;
      if (newColors === undefined) newColors = [];
  }

  let newColorImages = req.body.colorImages;
  if (newColorImages === undefined) {
      newColorImages = oldProduct.colorImages;
      if (newColorImages === undefined) newColorImages = {};
  }

  let newSizes = req.body.sizes;
  if (newSizes === undefined) {
      newSizes = oldProduct.sizes;
      if (newSizes === undefined) newSizes = [];
  }

  const updatedProduct = {
    id: productId,
    name: newName,
    description: newDescription,
    price: newPrice,
    categoryId: newCategoryId,
    stock: newStock,
    imageUrl: newImageUrl,
    colors: newColors,
    colorImages: newColorImages,
    sizes: newSizes,
    createdAt: oldProduct.createdAt,
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

router.delete('/:id', authenticate, authorize('administrator'), async (req, res) => {
  const productId = parseInt(req.params.id);
  const db = await getDB();
  
  const index = db.data.products.findIndex((p) => p.id === productId);
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

router.get('/categories', async (req, res) => {
  const db = await getDB();
  res.json(db.data.categories);
});

module.exports = router;