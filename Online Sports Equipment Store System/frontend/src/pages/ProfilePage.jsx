import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { userService } from '../services/userService';
import {
  User, Mail, Phone, Calendar, LogOut, Package,
  Camera, Edit2, X, Save, Lock, Eye, EyeOff, Loader2
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'ออกจากระบบ?',
      text: 'คุณต้องการออกจากระบบใช่หรือไม่',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      background: '#1a1a2e',
      color: '#fff',
    });


    if (result.isConfirmed) {
      logout();
      window.location.href = '/login';
    }
  };


  const handleAvatarClick = () => {
    if (isEditing === false) {
      return;
    }
    fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
        background: '#1a1a2e',
        color: '#fff',
      });
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ใหญ่เกินไป',
        text: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB',
        background: '#1a1a2e',
        color: '#fff',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };


  const handleCancelEdit = () => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setAvatar(user?.avatar || null);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (fullName.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบ',
        text: 'กรุณากรอกชื่อ-นามสกุล',
        background: '#1a1a2e',
        color: '#fff',
      });
      return;
    }

    setSaving(true);

    try {
      const res = await userService.updateProfile({
        fullName: fullName,
        phone: phone,
        avatar: avatar,
      });

      if (res.success === true) {
        updateUser(res.data);
        setIsEditing(false);

        Swal.fire({
          icon: 'success',
          title: 'บันทึกโปรไฟล์สำเร็จ',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          background: '#1a1a2e',
          color: '#fff',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'บันทึกไม่สำเร็จ',
          text: res.error || 'เกิดข้อผิดพลาด',
          background: '#1a1a2e',
          color: '#fff',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'เกิดข้อผิดพลาดในการบันทึก',
        background: '#1a1a2e',
        color: '#fff',
      });
    }

    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (currentPassword === '' || newPassword === '') {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบ',
        text: 'กรุณากรอกรหัสผ่านให้ครบถ้วน',
        background: '#1a1a2e',
        color: '#fff',
      });
      return;
    }


    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านสั้นเกินไป',
        text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
        background: '#1a1a2e',
        color: '#fff',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน',
        background: '#1a1a2e',
        color: '#fff',
      });
      return;
    }

    setSaving(true);

    try {
      const res = await userService.updateProfile({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      if (res.success === true) {
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนรหัสผ่านสำเร็จ',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          background: '#1a1a2e',
          color: '#fff',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
          text: res.error || 'เกิดข้อผิดพลาด',
          background: '#1a1a2e',
          color: '#fff',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
        text: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
        background: '#1a1a2e',
        color: '#fff',
      });
    }

    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black mb-8">👤 โปรไฟล์</h1>

          <div className="glass-card">
            <div className="flex items-center gap-6 mb-8">
              {/* รูปโปรไฟล์ */}
              <div
                onClick={handleAvatarClick}
                className={`relative w-20 h-20 rounded-full bg-sports-red flex items-center justify-center text-3xl font-bold overflow-hidden shrink-0 ${isEditing ? 'cursor-pointer group' : ''}`}
              >
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b border-white/30 focus:border-sports-red outline-none w-full"
                    placeholder="ชื่อ-นามสกุล"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{user?.fullName || user?.username}</h2>
                )}
                <p className="text-gray-400">
                  {user?.role === 'administrator' ? '👑 ผู้ดูแลระบบ' :
                    user?.role === 'staff' ? '🛠️ พนักงาน' : '👤 ลูกค้า'}
                </p>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg glass hover:bg-white/10 transition"
                  title="แก้ไขโปรไฟล์"
                >
                  <Edit2 size={18} />
                </button>
              )}
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

              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <Phone size={20} className="text-sports-red" />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">เบอร์โทรศัพท์</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="font-semibold bg-transparent border-b border-white/30 focus:border-sports-red outline-none w-full"
                      placeholder="เบอร์โทรศัพท์"
                    />
                  ) : (
                    <p className="font-semibold">{user?.phone || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 glass rounded-lg">
                <Calendar size={20} className="text-sports-red" />
                <div>
                  <p className="text-sm text-gray-400">วันที่สมัคร</p>
                  <p className="font-semibold">{user?.createdAt || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 btn-primary justify-center inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  บันทึก
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 border border-white/20 px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition"
                >
                  <X size={18} /> ยกเลิก
                </button>
              </div>
            )}

            {/* เปลี่ยนรหัสผ่าน */}
            <div className="mt-8 pt-6 border-t border-white/10">
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-sports-red transition"
                >
                  <Lock size={16} /> เปลี่ยนรหัสผ่าน
                </button>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-bold flex items-center gap-2"><Lock size={16} /> เปลี่ยนรหัสผ่าน</h3>

                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="รหัสผ่านปัจจุบัน"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-3 pr-10 glass rounded-lg outline-none focus:ring-1 focus:ring-sports-red"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 pr-10 glass rounded-lg outline-none focus:ring-1 focus:ring-sports-red"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 glass rounded-lg outline-none focus:ring-1 focus:ring-sports-red"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="flex-1 btn-primary justify-center inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      บันทึกรหัสผ่านใหม่
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 border border-white/20 px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition"
                    >
                      <X size={18} /> ยกเลิก
                    </button>
                  </div>
                </div>
              )}
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