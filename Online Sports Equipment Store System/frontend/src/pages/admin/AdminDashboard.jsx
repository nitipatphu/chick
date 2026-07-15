import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, orders: 0, products: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const users = await userService.getAll();
        const orders = await orderService.getAll();
        const products = await productService.getAll();
        
        const totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        setStats({
          users: users.length || 0,
          orders: orders.length || 0,
          products: products.length || 0,
          revenue: totalRevenue,
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">👑 แผงควบคุมผู้ดูแลระบบ</h1>
          <p className="text-gray-400">ยินดีต้อนรับ {user?.fullName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">{stats.users}</p>
            <p className="text-gray-400 text-sm">ผู้ใช้งาน</p>
          </div>
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">{stats.orders}</p>
            <p className="text-gray-400 text-sm">คำสั่งซื้อ</p>
          </div>
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">{stats.products}</p>
            <p className="text-gray-400 text-sm">สินค้า</p>
          </div>
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">฿{stats.revenue.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">ยอดขายรวม</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/users" className="glass-card text-center hover:border-sports-red">
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-bold">จัดการผู้ใช้งาน</h3>
            <p className="text-gray-400 text-sm">เพิ่ม/แก้ไข/ลบ ผู้ใช้</p>
          </Link>
          <Link to="/admin/products" className="glass-card text-center hover:border-sports-red">
            <div className="text-3xl mb-2">🏷️</div>
            <h3 className="font-bold">จัดการสินค้า</h3>
            <p className="text-gray-400 text-sm">เพิ่ม/แก้ไข/ลบ สินค้า</p>
          </Link>
          <Link to="/admin/categories" className="glass-card text-center hover:border-sports-red">
            <div className="text-3xl mb-2">📂</div>
            <h3 className="font-bold">จัดการหมวดหมู่</h3>
            <p className="text-gray-400 text-sm">เพิ่ม/แก้ไข/ลบ หมวดหมู่</p>
          </Link>
          <Link to="/admin/orders" className="glass-card text-center hover:border-sports-red">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-bold">จัดการคำสั่งซื้อ</h3>
            <p className="text-gray-400 text-sm">ดูและอัปเดตสถานะ</p>
          </Link>
          <Link to="/admin/settings" className="glass-card text-center hover:border-sports-red">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-bold">ตั้งค่าระบบ</h3>
            <p className="text-gray-400 text-sm">จัดการการชำระเงินและ QR</p>
          </Link>
          <Link to="/admin/logs" className="glass-card text-center hover:border-sports-red">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold">ประวัติสต็อก</h3>
            <p className="text-gray-400 text-sm">ดูความเคลื่อนไหวสต็อก</p>
          </Link>
        </div>
      </div>
    </div>
  );
}