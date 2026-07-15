import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, LogOut, Package } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black mb-8">👤 โปรไฟล์</h1>

          <div className="glass-card">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-sports-red flex items-center justify-center text-3xl font-bold">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.fullName || user?.username}</h2>
                <p className="text-gray-400">
                  {user?.role === 'administrator' ? '👑 ผู้ดูแลระบบ' : 
                   user?.role === 'staff' ? '🛠️ พนักงาน' : '👤 ลูกค้า'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <User size={20} className="text-sports-red" />
                <div>
                  <p className="text-sm text-gray-400">ชื่อผู้ใช้</p>
                  <p className="font-semibold">{user?.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <Mail size={20} className="text-sports-red" />
                <div>
                  <p className="text-sm text-gray-400">อีเมล</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
              </div>

              {user?.phone && (
                <div className="flex items-center gap-3 p-3 glass rounded-lg">
                  <Phone size={20} className="text-sports-red" />
                  <div>
                    <p className="text-sm text-gray-400">เบอร์โทรศัพท์</p>
                    <p className="font-semibold">{user?.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <Calendar size={20} className="text-sports-red" />
                <div>
                  <p className="text-sm text-gray-400">วันที่สมัคร</p>
                  <p className="font-semibold">{user?.createdAt || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
              <Link to="/orders" className="flex-1 btn-primary justify-center inline-flex items-center gap-2">
                <Package size={18} /> ประวัติการสั่งซื้อ
              </Link>
              <button 
                onClick={handleLogout} 
                className="flex-1 flex items-center justify-center gap-2 border border-red-500 text-red-500 px-6 py-3 rounded-lg font-bold hover:bg-red-500 hover:text-white transition"
              >
                <LogOut size={18} /> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}