import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      navigate('/');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      setError(err.response?.data?.error || 'สมัครสมาชิกล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20 pb-20">
      <div className="glass-card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-sports-red">SPORTS</span>GEAR
          </h1>
          <p className="text-gray-400 mt-2">สมัครสมาชิกเพื่อสัมผัสประสบการณ์ที่ดีที่สุด</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">ชื่อผู้ใช้ *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="ตั้งชื่อผู้ใช้ของคุณ"
                className="input-dark"
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">อีเมล *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="example@email.com"
                className="input-dark"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="081-234-5678"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">รหัสผ่าน *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="กรอกรหัสผ่านอย่างน้อย 6 ตัว"
                className="input-dark"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">ยืนยันรหัสผ่าน *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                className="input-dark"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-6 disabled:opacity-50"
          >
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-sports-red hover:underline font-semibold">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
