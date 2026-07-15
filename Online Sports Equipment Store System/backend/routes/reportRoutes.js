const express = require('express');
const router = express.Router();
const { getDB } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

// Dashboard Summary (Admin Only) 
router.get('/dashboard', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const db = await getDB();
    
    const totalUsers = db.data.users.length;
    const totalProducts = db.data.products.length;
    const totalOrders = db.data.orders.length;
    

    const totalRevenue = db.data.orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0);


    const ordersByStatus = {};
    db.data.orders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });


    const productSales = {};
    db.data.orderItems.forEach(item => {
      productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, sold]) => {
        const product = db.data.products.find(p => p.id === parseInt(productId));
        return {
          id: parseInt(productId),
          name: product?.name || 'ไม่พบสินค้า',
          sold
        };
      });


    const monthlySales = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    db.data.orders
      .filter(order => order.status !== 'cancelled' && new Date(order.createdAt) >= sixMonthsAgo)
      .forEach(order => {
        const month = order.createdAt.substring(0, 7); // YYYY-MM
        monthlySales[month] = (monthlySales[month] || 0) + order.totalAmount;
      });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        ordersByStatus,
        topProducts,
        monthlySales
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sales Report
router.get('/sales', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = await getDB();

    let orders = db.data.orders.filter(order => order.status !== 'cancelled');

    if (startDate) {
      orders = orders.filter(order => order.createdAt >= startDate);
    }
    if (endDate) {
      orders = orders.filter(order => order.createdAt <= endDate);
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const orderDetails = orders.map(order => {
      const user = db.data.users.find(u => u.id === order.userId);
      return {
        id: order.id,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
        customer: user?.fullName || 'ไม่ระบุ',
        paymentMethod: order.paymentMethod
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          startDate: startDate || 'ทั้งหมด',
          endDate: endDate || 'ทั้งหมด'
        },
        orders: orderDetails
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;