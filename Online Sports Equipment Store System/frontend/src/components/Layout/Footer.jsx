import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-sports-dark border-t border-white/5 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-sports-red">SPORTS</span>GEAR
            </h3>
            <p className="text-gray-400 text-sm">อุปกรณ์กีฬาคุณภาพสูง ระดับท็อป เพื่อนักกีฬาทุกคน</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">ลิงก์ด่วน</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-sports-red transition">หน้าแรก</Link></li>
              <li><Link to="/products" className="hover:text-sports-red transition">สินค้า</Link></li>
              <li><Link to="/orders" className="hover:text-sports-red transition">คำสั่งซื้อ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">หมวดหมู่</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/products?category=1" className="hover:text-sports-red transition">รองเท้า</Link></li>
              <li><Link to="/products?category=2" className="hover:text-sports-red transition">ฟุตบอล</Link></li>
              <li><Link to="/products?category=3" className="hover:text-sports-red transition">บาสเกตบอล</Link></li>
              <li><Link to="/products?category=4" className="hover:text-sports-red transition">เสื้อผ้า</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">รับข่าวสาร</h4>
            <p className="text-gray-400 text-sm mb-3">รับส่วนลด 20% เมื่อสมัครสมาชิก</p>
            <div className="flex">
              <input type="email" placeholder="อีเมลของคุณ" className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-l-lg text-sm focus:outline-none focus:border-sports-red" />
              <button className="px-4 py-2 bg-sports-red rounded-r-lg hover:bg-sports-orange transition text-sm">สมัคร</button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>© 2026 SPORTSGEAR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;