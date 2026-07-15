import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        const role = result.user.role;
        if (role === 'administrator') navigate('/admin');
        else if (role === 'staff') navigate('/staff');
        else navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'เข้าสู่ระบบล้มเหลว');
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
          <p className="text-gray-400 mt-2">เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="กรอกชื่อผู้ใช้ของคุณ"
              className="input-dark"
              required
            />
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-300">
                รหัสผ่าน (Password)
              </label>
              <Link to="/reset-password" className="text-xs text-sports-red hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="กรอกรหัสผ่านของคุณ"
              className="input-dark"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-sports-red hover:underline font-semibold">
            สมัครสมาชิก
          </Link>
        </p>

        <div className="mt-6 p-4 glass rounded-lg text-sm">
          <p className="text-gray-400 text-center mb-2">👤 บัญชีทดสอบ</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <span className="font-semibold text-white">Customer</span>
              <p className="text-gray-500">customer1</p>
              <p className="text-gray-500">password123</p>
            </div>
            <div>
              <span className="font-semibold text-white">Staff</span>
              <p className="text-gray-500">staff1</p>
              <p className="text-gray-500">password123</p>
            </div>
            <div>
              <span className="font-semibold text-white">Admin</span>
              <p className="text-gray-500">admin</p>
              <p className="text-gray-500">password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}