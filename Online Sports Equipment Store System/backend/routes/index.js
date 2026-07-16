const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const reportRoutes = require('./reportRoutes');
const settingsRoutes = require('./settingsRoutes');
const addressRoutes = require('./addressRoutes');
const uploadRoutes = require('./uploadRoutes');
const categoryRoutes = require('./categoryRoutes');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/addresses', addressRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;