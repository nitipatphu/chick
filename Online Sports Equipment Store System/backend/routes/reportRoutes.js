const express = require('express');
const router = express.Router();
const { getDB } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const db = await getDB();

    const totalUsers = db.data.users.length;
    const totalProducts = db.data.products.length;
    const totalOrders = db.data.orders.length;

    let totalRevenue = 0;
    for (let i = 0; i < db.data.orders.length; i++) {
      if (db.data.orders[i].status !== 'cancelled') {
        totalRevenue = totalRevenue + db.data.orders[i].totalAmount;
      }
    }

    const ordersByStatus = {};
    for (let i = 0; i < db.data.orders.length; i++) {
      const orderStatus = db.data.orders[i].status;
      if (ordersByStatus[orderStatus] === undefined) {
        ordersByStatus[orderStatus] = 0;
      }
      ordersByStatus[orderStatus] = ordersByStatus[orderStatus] + 1;
    }

    const productSales = {};
    for (let i = 0; i < db.data.orderItems.length; i++) {
      const productId = db.data.orderItems[i].productId;
      if (productSales[productId] === undefined) {
        productSales[productId] = 0;
      }
      productSales[productId] = productSales[productId] + db.data.orderItems[i].quantity;
    }

    const productSalesArray = Object.entries(productSales);
    productSalesArray.sort((a, b) => b[1] - a[1]);

    const topProducts = [];
    let loopCount = 5;
    if (productSalesArray.length < 5) {
      loopCount = productSalesArray.length;
    }

    for (let i = 0; i < loopCount; i++) {
      const productId = parseInt(productSalesArray[i][0]);
      const sold = productSalesArray[i][1];
      const product = db.data.products.find((p) => p.id === productId);

      let productName = 'ไม่พบสินค้า';
      if (product !== undefined) {
        productName = product.name;
      }

      topProducts.push({
        id: productId,
        name: productName,
        sold: sold
      });
    }

    const monthlySales = {};
    const orderMap = {};
    for (let i = 0; i < db.data.orders.length; i++) {
      orderMap[db.data.orders[i].id] = db.data.orders[i];
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRevenue = 0;
    let todayOrders = 0;
    let weekRevenue = 0;
    let weekOrders = 0;
    let monthRevenue = 0;
    let monthOrders = 0;

    for (let i = 0; i < db.data.orders.length; i++) {
      const order = db.data.orders[i];
      if (order.status === 'cancelled') continue;

      const orderDate = new Date(order.createdAt || order.orderDate);

      if (orderDate >= startOfToday) {
        todayRevenue = todayRevenue + order.totalAmount;
        todayOrders = todayOrders + 1;
      }
      if (orderDate >= startOfWeek) {
        weekRevenue = weekRevenue + order.totalAmount;
        weekOrders = weekOrders + 1;
      }
      if (orderDate >= startOfMonth) {
        monthRevenue = monthRevenue + order.totalAmount;
        monthOrders = monthOrders + 1;
      }
    }

    const categorySales = {};

    for (let i = 0; i < db.data.orderItems.length; i++) {
      const item = db.data.orderItems[i];
      const order = orderMap[item.orderId];

      if (order === undefined) continue;
      if (order.status === 'cancelled') continue;

      const product = db.data.products.find((p) => p.id === item.productId);
      if (product === undefined) continue;

      const category = db.data.categories.find((c) => c.id === product.categoryId);
      let categoryName = 'ไม่ระบุหมวดหมู่';
      if (category !== undefined) {
        categoryName = category.name;
      }

      if (categorySales[categoryName] === undefined) {
        categorySales[categoryName] = { revenue: 0, quantity: 0 };
      }
      categorySales[categoryName].revenue = categorySales[categoryName].revenue + (item.price * item.quantity);
      categorySales[categoryName].quantity = categorySales[categoryName].quantity + item.quantity;
    }

    const salesByCategory = [];
    for (const categoryName in categorySales) {
      salesByCategory.push({
        category: categoryName,
        revenue: categorySales[categoryName].revenue,
        quantity: categorySales[categoryName].quantity
      });
    }
    salesByCategory.sort((a, b) => b.revenue - a.revenue);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (let i = 0; i < db.data.orders.length; i++) {
      const order = db.data.orders[i];
      if (order.status !== 'cancelled' && new Date(order.createdAt) >= sixMonthsAgo) {
        const month = order.createdAt.substring(0, 7);
        if (monthlySales[month] === undefined) {
          monthlySales[month] = 0;
        }
        monthlySales[month] = monthlySales[month] + order.totalAmount;
      }
    }

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers,
        totalProducts: totalProducts,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        ordersByStatus: ordersByStatus,
        topProducts: topProducts,
        monthlySales: monthlySales,
        today: { revenue: todayRevenue, orders: todayOrders },
        week: { revenue: weekRevenue, orders: weekOrders },
        month: { revenue: monthRevenue, orders: monthOrders },
        salesByCategory: salesByCategory
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sales', authenticate, authorize('administrator'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = await getDB();

    let orders = [];
    for (let i = 0; i < db.data.orders.length; i++) {
      if (db.data.orders[i].status !== 'cancelled') {
        orders.push(db.data.orders[i]);
      }
    }

    if (startDate !== undefined) {
      const filteredOrders = [];
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].createdAt >= startDate) {
          filteredOrders.push(orders[i]);
        }
      }
      orders = filteredOrders;
    }

    if (endDate !== undefined) {
      const filteredOrders = [];
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].createdAt <= endDate) {
          filteredOrders.push(orders[i]);
        }
      }
      orders = filteredOrders;
    }

    const totalOrders = orders.length;
    let totalRevenue = 0;
    for (let i = 0; i < orders.length; i++) {
      totalRevenue = totalRevenue + orders[i].totalAmount;
    }

    let averageOrderValue = 0;
    if (totalOrders > 0) {
      averageOrderValue = totalRevenue / totalOrders;
    }

    const orderDetails = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const user = db.data.users.find((u) => u.id === order.userId);

      let customerName = 'ไม่ระบุ';
      if (user !== undefined && user.fullName !== undefined) {
        customerName = user.fullName;
      }

      orderDetails.push({
        id: order.id,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
        customer: customerName,
        paymentMethod: order.paymentMethod
      });
    }

    let finalStartDate = startDate;
    if (finalStartDate === undefined) finalStartDate = 'ทั้งหมด';

    let finalEndDate = endDate;
    if (finalEndDate === undefined) finalEndDate = 'ทั้งหมด';

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders: totalOrders,
          totalRevenue: totalRevenue,
          averageOrderValue: averageOrderValue,
          startDate: finalStartDate,
          endDate: finalEndDate
        },
        orders: orderDetails
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;