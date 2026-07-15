import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { User, Package, LogOut, ShoppingCart, Menu, X, Home, ShoppingBag, Settings, ClipboardList, Boxes } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin, isStaff, loading } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 w-full bg-sports-dark/95 backdrop-blur-lg border-b border-white/5 z-50">
        <div className="container">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-sports-red">SPORTS</span>GEAR
            </Link>
            <div className="animate-pulse">
              <div className="w-24 h-8 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 w-full bg-sports-dark/95 backdrop-blur-lg border-b border-white/5 z-50">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold hover:text-sports-red transition">
            <span className="text-sports-red">SPORTS</span>GEAR
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-sports-red transition flex items-center gap-1">
              <Home size={18} /> หน้าแรก
            </Link>
            <Link to="/products" className="hover:text-sports-red transition flex items-center gap-1">
              <ShoppingBag size={18} /> สินค้า
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/orders" className="hover:text-sports-red transition flex items-center gap-1">
                  <Package size={18} /> คำสั่งซื้อ
                </Link>
                {(isStaff) && (
                  <Link to="/staff" className="hover:text-sports-red transition flex items-center gap-1">
                    <Boxes size={18} /> จัดการระบบ
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="hover:text-sports-red transition flex items-center gap-1">
                    <Settings size={18} /> จัดการระบบ
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {(!user || user.role === 'customer') && (
              <Link to="/cart" className="relative hover:text-sports-red transition">
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-sports-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:text-sports-red transition"
                >
                  <span className="hidden sm:inline">{user?.fullName || user?.username}</span>
                  <div className="w-8 h-8 rounded-full bg-sports-red flex items-center justify-center text-white font-bold">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass rounded-xl py-2 shadow-2xl border border-white/10">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="font-semibold">{user?.fullName || user?.username}</p>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                      <p className="text-xs text-sports-red mt-1">
                        {isAdmin ? '👑 ผู้ดูแลระบบ' : isStaff ? '🛠️ พนักงาน' : '👤 ลูกค้า'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNavigate('/profile')}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-white/5 transition"
                    >
                      <User size={18} /> โปรไฟล์
                    </button>
                    <button
                      onClick={() => handleNavigate('/orders')}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-white/5 transition"
                    >
                      <Package size={18} /> ประวัติการสั่งซื้อ
                    </button>
                    {(isAdmin || isStaff) && (
                      <button
                        onClick={() => handleNavigate('/admin/inventory')}
                        className="flex items-center gap-3 w-full px-4 py-2 hover:bg-white/5 transition"
                      >
                        <Boxes size={18} /> คลังสินค้า
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleNavigate('/admin')}
                        className="flex items-center gap-3 w-full px-4 py-2 hover:bg-white/5 transition text-sports-red"
                      >
                        <Settings size={18} /> จัดการระบบ
                      </button>
                    )}
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-white/5 transition text-red-500"
                    >
                      <LogOut size={18} /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4">
                เข้าสู่ระบบ
              </Link>
            )}

            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3">
            <Link to="/" className="flex items-center gap-2 py-2 hover:text-sports-red transition" onClick={() => setIsMobileMenuOpen(false)}>
              <Home size={18} /> หน้าแรก
            </Link>
            <Link to="/products" className="flex items-center gap-2 py-2 hover:text-sports-red transition" onClick={() => setIsMobileMenuOpen(false)}>
              <ShoppingBag size={18} /> สินค้า
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/orders" className="flex items-center gap-2 py-2 hover:text-sports-red transition" onClick={() => setIsMobileMenuOpen(false)}>
                  <Package size={18} /> คำสั่งซื้อ
                </Link>
                {(isAdmin || isStaff) && (
                  <Link to="/admin/inventory" className="flex items-center gap-2 py-2 hover:text-sports-red transition" onClick={() => setIsMobileMenuOpen(false)}>
                    <Boxes size={18} /> คลังสินค้า
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 py-2 hover:text-sports-red transition" onClick={() => setIsMobileMenuOpen(false)}>
                    <Settings size={18} /> จัดการระบบ
                  </Link>
                )}
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 w-full text-left py-2 text-red-500 hover:text-red-400 transition">
                  <LogOut size={18} /> ออกจากระบบ
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;