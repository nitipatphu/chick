import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customData, setCustomData] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await reportService.getDashboard();
        if (res.success === true) {
          setData(res.data);
        }
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearchCustomRange = async () => {
    if (startDate === '' || endDate === '') {
      alert('กรุณาเลือกวันที่ให้ครบทั้งสองช่อง');
      return;
    }

    if (startDate > endDate) {
      alert('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด');
      return;
    }

    setCustomLoading(true);
    try {
      const res = await reportService.getSales(startDate, endDate);
      if (res.success === true) {
        setCustomData(res.data);
      }
    } catch (error) {
      console.log(error);
    }
    setCustomLoading(false);
  };

  const handleResetCustomRange = () => {
    setStartDate('');
    setEndDate('');
    setCustomData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
        <div className="container">
          <p>โหลดข้อมูลไม่สำเร็จ</p>
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">{data.totalUsers}</p>
            <p className="text-gray-400 text-sm">ผู้ใช้งาน</p>
          </div>
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">{data.totalOrders}</p>
            <p className="text-gray-400 text-sm">คำสั่งซื้อ</p>
          </div>
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">{data.totalProducts}</p>
            <p className="text-gray-400 text-sm">สินค้า</p>
          </div>
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">฿{data.totalRevenue.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">ยอดขายรวม</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">ยอดขายตามช่วงเวลา</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass-card">
            <p className="text-gray-400 text-sm mb-1">วันนี้</p>
            <p className="text-2xl font-bold text-sports-red">฿{data.today.revenue.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">{data.today.orders} ออเดอร์</p>
          </div>
          <div className="glass-card">
            <p className="text-gray-400 text-sm mb-1">7 วันล่าสุด</p>
            <p className="text-2xl font-bold text-sports-red">฿{data.week.revenue.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">{data.week.orders} ออเดอร์</p>
          </div>
          <div className="glass-card">
            <p className="text-gray-400 text-sm mb-1">เดือนนี้</p>
            <p className="text-2xl font-bold text-sports-red">฿{data.month.revenue.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">{data.month.orders} ออเดอร์</p>
          </div>
        </div>

        <div className="glass-card mb-8">
          <p className="font-bold mb-3">กำหนดช่วงเวลาเอง</p>
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">วันที่เริ่มต้น</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 glass rounded-lg outline-none focus:ring-1 focus:ring-sports-red"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">วันที่สิ้นสุด</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 glass rounded-lg outline-none focus:ring-1 focus:ring-sports-red"
              />
            </div>
            <button
              onClick={handleSearchCustomRange}
              disabled={customLoading}
              className="btn-primary px-6 py-3 disabled:opacity-50"
            >
              {customLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
            </button>
            {customData !== null && (
              <button
                onClick={handleResetCustomRange}
                className="border border-white/20 px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition"
              >
                ล้างค่า
              </button>
            )}
          </div>

          {customData !== null && (
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="glass p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-sports-red">฿{customData.summary.totalRevenue.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">ยอดขายรวม</p>
                </div>
                <div className="glass p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-sports-red">{customData.summary.totalOrders}</p>
                  <p className="text-gray-400 text-sm">จำนวนออเดอร์</p>
                </div>
                <div className="glass p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-sports-red">฿{Math.round(customData.summary.averageOrderValue).toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">เฉลี่ยต่อออเดอร์</p>
                </div>
              </div>

              {customData.orders.length === 0 ? (
                <p className="text-gray-400 text-center py-4">ไม่มีคำสั่งซื้อในช่วงเวลานี้</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="pb-2">วันที่</th>
                        <th className="pb-2">ลูกค้า</th>
                        <th className="pb-2">สถานะ</th>
                        <th className="pb-2 text-right">ยอดเงิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customData.orders.map((order) => (
                        <tr key={order.id} className="border-b border-white/5">
                          <td className="py-2">{order.orderDate}</td>
                          <td className="py-2">{order.customer}</td>
                          <td className="py-2">{order.status}</td>
                          <td className="py-2 text-right">฿{order.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold mb-4">ยอดขายตามหมวดหมู่</h2>
        <div className="glass-card mb-8">
          {data.salesByCategory.length === 0 ? (
            <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {data.salesByCategory.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold">{item.category}</p>
                    <p className="text-gray-400 text-sm">ขายไป {item.quantity} ชิ้น</p>
                  </div>
                  <p className="font-bold text-sports-red">฿{item.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold mb-4">สินค้าขายดี Top 5</h2>
        <div className="glass-card mb-8">
          {data.topProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-sports-red flex items-center justify-center text-sm font-bold">{index + 1}</span>
                    <p className="font-semibold">{item.name}</p>
                  </div>
                  <p className="text-gray-400">ขายไป {item.sold} ชิ้น</p>
                </div>
              ))}
            </div>
          )}
        </div>

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