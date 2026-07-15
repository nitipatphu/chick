import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import Swal from 'sweetalert2';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่านให้ตรงกัน',
        background: '#1a1f2e',
        color: '#fff'
      });
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(formData.username, formData.email, formData.newPassword);
      
      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'รหัสผ่านของคุณถูกรีเซ็ตเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
        background: '#1a1f2e',
        color: '#fff',
        confirmButtonColor: '#e11d48'
      });
      
      navigate('/login');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถรีเซ็ตรหัสผ่านได้',
        text: error.response?.data?.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
        background: '#1a1f2e',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-16 pb-10 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white italic mb-2 tracking-wider">
            RESET <span className="text-sports-red">PASSWORD</span>
          </h1>
          <p className="text-gray-400">รีเซ็ตรหัสผ่านของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-8 rounded-2xl">
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-300 mb-2">
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="กรอกชื่อผู้ใช้ที่ใช้เข้าสู่ระบบ"
              className="input-dark"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-300 mb-2">
              อีเมล (Email)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="กรอกอีเมลที่ใช้สมัครสมาชิก"
              className="input-dark"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-300 mb-2">
              รหัสผ่านใหม่ (New Password)
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
              className="input-dark"
              required
              minLength={6}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-300 mb-2">
              ยืนยันรหัสผ่านใหม่ (Confirm Password)
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              className="input-dark"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? 'กำลังดำเนินการ...' : 'รีเซ็ตรหัสผ่าน'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          <Link to="/login" className="text-sports-red hover:underline font-semibold flex items-center justify-center gap-1">
            <span>&larr;</span> กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
