import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../services/addressService';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Check, Edit, Trash2, X, Star, ArrowLeft } from 'lucide-react';

export default function AddressSelector({ onSelect, selectedAddressId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: '',
    district: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await addressService.getAll();
      setAddresses(data);
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr && !selectedAddressId) {
        onSelect(defaultAddr.id);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await addressService.update(editingAddress.id, formData);
      } else {
        await addressService.create(formData);
      }
      setShowForm(false);
      setEditingAddress(null);
      setFormData({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        address: '',
        district: '',
        city: '',
        province: '',
        postalCode: '',
        isDefault: false
      });
      await loadAddresses();
      // กลับไปหน้า checkout
      navigate('/checkout');
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบที่อยู่นี้ใช่หรือไม่?')) return;
    try {
      await addressService.delete(id);
      await loadAddresses();
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      await loadAddresses();
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      district: address.district || '',
      city: address.city,
      province: address.province || '',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingAddress(null);
    setFormData({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      address: '',
      district: '',
      city: '',
      province: '',
      postalCode: '',
      isDefault: addresses.length === 0
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sports-red"></div>
      </div>
    );
  }

  // ถ้าเปิดฟอร์ม ให้ไปหน้าใหม่แทน Modal
  if (showForm) {
    return (
      <div className="min-h-[400px]">
        <AddressForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAddress(null);
            navigate('/checkout');
          }}
          editingAddress={editingAddress}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Address List */}
      {addresses.map((addr) => (
        <div
          key={addr.id}
          onClick={() => onSelect(addr.id)}
          className={`glass-card p-4 cursor-pointer transition-all ${
            selectedAddressId === addr.id ? 'border-sports-red ring-2 ring-sports-red/50' : 'hover:border-white/20'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                {addr.isDefault ? (
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                ) : (
                  <MapPin size={18} className="text-sports-red" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{addr.fullName}</p>
                  <span className="text-sm text-gray-400">| {addr.phone}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                      หลัก
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5 break-words">
                  {addr.address}
                  {addr.district && `, ${addr.district}`}
                  {addr.city && `, ${addr.city}`}
                  {addr.province && `, ${addr.province}`}
                  {addr.postalCode && ` ${addr.postalCode}`}
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              {!addr.isDefault && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                  className="p-1.5 hover:text-yellow-400 transition rounded-lg hover:bg-white/5"
                  title="ตั้งเป็นที่อยู่หลัก"
                >
                  <Star size={15} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                className="p-1.5 hover:text-sports-red transition rounded-lg hover:bg-white/5"
              >
                <Edit size={15} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                className="p-1.5 hover:text-red-500 transition rounded-lg hover:bg-white/5"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add New Address Button */}
      <button
        onClick={handleAddNew}
        className="w-full py-3 border-2 border-dashed border-white/15 rounded-xl text-gray-400 hover:text-white hover:border-sports-red/50 hover:bg-sports-red/5 transition flex items-center justify-center gap-2"
      >
        <Plus size={18} /> เพิ่มที่อยู่ใหม่
      </button>
    </div>
  );
}

// ============ Address Form Component (หน้าใหม่ แยกจากกัน) ============
function AddressForm({ formData, setFormData, onSubmit, onCancel, editingAddress }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-xl font-bold">
            {editingAddress ? '✏️ แก้ไขที่อยู่' : '📍 เพิ่มที่อยู่ใหม่'}
          </h3>
          <p className="text-sm text-gray-400">
            {editingAddress ? 'ปรับปรุงข้อมูลที่อยู่ของคุณ' : 'กรอกข้อมูลที่อยู่สำหรับจัดส่ง'}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* ชื่อและเบอร์โทร */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
              required
              placeholder="สมชาย ลูกค้า"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
              required
              placeholder="081-234-5678"
            />
          </div>
        </div>

        {/* ที่อยู่ */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            ที่อยู่ (บ้านเลขที่, ซอย, ถนน) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
            required
            placeholder="123/45 ถนนสุขุมวิท"
          />
        </div>

        {/* ตำบล/แขวง และ อำเภอ/เขต */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              ตำบล/แขวง
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
              placeholder="คลองเตย"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              อำเภอ/เขต <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
              required
              placeholder="คลองเตย"
            />
          </div>
        </div>

        {/* จังหวัด และ รหัสไปรษณีย์ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              จังหวัด
            </label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
              placeholder="กรุงเทพมหานคร"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              รหัสไปรษณีย์
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
              placeholder="10110"
            />
          </div>
        </div>

        {/* Set as Default */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
          <input
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="w-4 h-4 accent-sports-red rounded"
          />
          <label htmlFor="isDefault" className="text-sm text-gray-300 cursor-pointer flex items-center gap-1.5">
            <Star size={14} className="text-yellow-400" />
            ตั้งเป็นที่อยู่หลัก
          </label>
          <span className="text-xs text-gray-500 ml-auto">(ใช้เป็นค่าเริ่มต้น)</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button 
            type="submit" 
            className="flex-1 py-3 bg-sports-red text-white rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
          >
            {editingAddress ? '💾 อัปเดต' : '✅ บันทึก'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-white/20 text-gray-400 rounded-lg font-semibold hover:bg-white/5 transition"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}