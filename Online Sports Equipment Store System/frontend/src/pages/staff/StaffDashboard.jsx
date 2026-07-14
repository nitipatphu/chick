import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Package, ClipboardList, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { inventoryService } from '../../services/inventoryService';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const inventory = await inventoryService.getInventory();
        
        const totalItems = inventory.length;
        const lowStock = inventory.filter(item => item.stock < 10).length;

        setStats({
          totalItems,
          lowStock
        });
      } catch (error) {
        console.error('Error fetching inventory stats:', error);
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
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Settings className="text-sports-red" size={32} /> แผงควบคุมพนักงาน (Staff)
          </h1>
          <p className="text-gray-400">เข้าสู่ระบบโดย: {user?.fullName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-sports-red">{stats.totalItems}</p>
            <p className="text-gray-400 text-sm">สินค้ารวมในระบบ</p>
          </div>
          <div className="glass-card text-center">
            <p className="text-3xl font-bold text-yellow-500">{stats.lowStock}</p>
            <p className="text-gray-400 text-sm">สินค้าที่ใกล้หมด (สต็อก &lt; 10)</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/staff/inventory" className="glass-card text-center hover:border-sports-red">
            <div className="flex justify-center mb-2 text-sports-red"><Package size={32} /></div>
            <h3 className="font-bold">จัดการคลังสินค้า</h3>
            <p className="text-gray-400 text-sm">ดูรายการสินค้า, เพิ่มสินค้า และอัปเดตสต็อก</p>
          </Link>
          <Link to="/staff/logs" className="glass-card text-center hover:border-sports-red">
            <div className="flex justify-center mb-2 text-sports-red"><FileText size={32} /></div>
            <h3 className="font-bold">ประวัติสต็อก</h3>
            <p className="text-gray-400 text-sm">ดูบันทึกการนำเข้าและตัดสต็อก</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
