import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { 
  UserPlus, Edit, Trash2, Search, X, 
  User, Mail, Phone, Shield, Eye, EyeOff,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
    role: 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ============ โหลดข้อมูลผู้ใช้ ============
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getAll();
      setUsers(response.data || response || []);
    } catch (err) {
      setError(err.response?.data?.error || 'โหลดข้อมูลผู้ใช้ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ============ เปิด Modal ============
  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role || 'customer'
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        email: '',
        fullName: '',
        phone: '',
        role: 'customer'
      });
    }
    setShowModal(true);
    setError('');
    setSuccessMessage('');
  };

  // ============ ปิด Modal ============
  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      phone: '',
      role: 'customer'
    });
    setError('');
    setSuccessMessage('');
  };

  // ============ จัดการฟอร์ม ============
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ============ บันทึกข้อมูล ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccessMessage('');

      if (!formData.username || !formData.email) {
        setError('กรุณากรอกชื่อผู้ใช้และอีเมล');
        return;
      }

      if (!editingUser && !formData.password) {
        setError('กรุณากรอกรหัสผ่านสำหรับผู้ใช้ใหม่');
        return;
      }

      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.update(editingUser.id, updateData);
        setSuccessMessage('✅ อัปเดตข้อมูลผู้ใช้สำเร็จ');
      } else {
        await userService.create(formData);
        setSuccessMessage('✅ เพิ่มผู้ใช้ใหม่สำเร็จ');
      }

      setTimeout(() => {
        closeModal();
        loadUsers();
      }, 1000);

    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  // ============ ลบผู้ใช้ ============
  const handleDelete = async (id, username) => {
    if (id === currentUser?.id) {
      alert('❌ ไม่สามารถลบบัญชีของตัวเองได้');
      return;
    }

    if (!window.confirm(`⚠️ คุณต้องการลบผู้ใช้ "${username}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      await userService.delete(id);
      alert('✅ ลบผู้ใช้สำเร็จ');
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || '❌ ลบผู้ใช้ล้มเหลว');
    }
  };

  // ============ Filter ผู้ใช้ ============
  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============ ฟังก์ชันแสดง Role ============
  const getRoleLabel = (role) => {
    const roles = {
      administrator: '👑 ผู้ดูแลระบบ',
      staff: '🛠️ พนักงาน',
      customer: '👤 ลูกค้า'
    };
    return roles[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      administrator: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      staff: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      customer: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // ============ ฟังก์ชันแสดงสถานะ ============
  const getStatusLabel = (role) => {
    if (role === 'administrator') return '👑 Admin';
    if (role === 'staff') return '🛠️ Staff';
    return '👤 Customer';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black">👤 จัดการผู้ใช้งาน</h1>
            <p className="text-gray-400 text-sm">จัดการข้อมูลผู้ใช้ในระบบ</p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={18} /> เพิ่มผู้ใช้
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-sports-red">{users.length}</p>
            <p className="text-xs text-gray-400">ผู้ใช้ทั้งหมด</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {users.filter(u => u.role === 'administrator').length}
            </p>
            <p className="text-xs text-gray-400">ผู้ดูแลระบบ</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {users.filter(u => u.role === 'staff').length}
            </p>
            <p className="text-xs text-gray-400">พนักงาน</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {users.filter(u => u.role === 'customer').length}
            </p>
            <p className="text-xs text-gray-400">ลูกค้า</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้ (ชื่อผู้ใช้,ชื่อ-นามสกุล,อีเมล) "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2.5 glass rounded-lg hover:text-sports-red transition"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Error/Success */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} /> {successMessage}
          </div>
        )}

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">ชื่อผู้ใช้</th>
                  <th className="px-4 py-3 hidden md:table-cell">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 hidden lg:table-cell">อีเมล</th>
                  <th className="px-4 py-3 hidden md:table-cell">เบอร์โทร</th>
                  <th className="px-4 py-3">บทบาท</th>
                  <th className="px-4 py-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                      {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้ในระบบ'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{user.username}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{user.fullName || '-'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-300">{user.email}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-300">{user.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-3 py-1 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(user)}
                            className="p-1.5 hover:text-sports-red transition rounded-lg hover:bg-white/5"
                            title="แก้ไข"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            className="p-1.5 hover:text-red-500 transition rounded-lg hover:bg-white/5"
                            disabled={user.id === currentUser?.id}
                            title={user.id === currentUser?.id ? 'ไม่สามารถลบตัวเอง' : 'ลบ'}
                          >
                            <Trash2 size={16} className={user.id === currentUser?.id ? 'opacity-30' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
          >
            <div 
              className="bg-sports-dark rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-sports-dark/95 backdrop-blur-sm z-10 px-6 pt-6 pb-4 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">
                      {editingUser ? '✏️ แก้ไขผู้ใช้' : '➕ เพิ่มผู้ใช้ใหม่'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {editingUser ? `กำลังแก้ไข ${editingUser.username}` : 'กรอกข้อมูลเพื่อสร้างผู้ใช้ใหม่'}
                    </p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* ชื่อผู้ใช้ */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <User size={14} className="inline mr-1.5 text-sports-red" />
                    ชื่อผู้ใช้ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                    required
                    minLength={3}
                    placeholder="ตั้งชื่อผู้ใช้"
                    disabled={!!editingUser}
                  />
                  {editingUser && (
                    <p className="text-xs text-gray-500 mt-1">ไม่สามารถแก้ไขชื่อผู้ใช้ได้</p>
                  )}
                </div>

                {/* รหัสผ่าน */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Shield size={14} className="inline mr-1.5 text-sports-red" />
                    {editingUser ? 'รหัสผ่าน (เว้นว่างไว้ไม่เปลี่ยน)' : 'รหัสผ่าน *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                      required={!editingUser}
                      minLength={6}
                      placeholder={editingUser ? 'เว้นว่างไว้ไม่เปลี่ยน' : 'กรอกรหัสผ่านอย่างน้อย 6 ตัว'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* อีเมล */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Mail size={14} className="inline mr-1.5 text-sports-red" />
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                    required
                    placeholder="example@email.com"
                  />
                </div>

                {/* ชื่อ-นามสกุล */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                    placeholder="สมชาย ลูกค้า"
                  />
                </div>

                {/* เบอร์โทร */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Phone size={14} className="inline mr-1.5 text-sports-red" />
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                    placeholder="081-234-5678"
                  />
                </div>

                {/* บทบาท */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Shield size={14} className="inline mr-1.5 text-sports-red" />
                    บทบาท
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                  >
                    <option value="customer">👤 ลูกค้า</option>
                    <option value="staff">🛠️ พนักงาน</option>
                    <option value="administrator">👑 ผู้ดูแลระบบ</option>
                  </select>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-sports-red text-white rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
                  >
                    {editingUser ? '💾 อัปเดต' : '✅ เพิ่มผู้ใช้'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 border border-white/20 text-gray-400 rounded-lg font-semibold hover:bg-white/5 transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}