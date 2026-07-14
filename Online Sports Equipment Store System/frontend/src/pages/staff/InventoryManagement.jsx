import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, X, Save, Edit2, Check, Package, Trash2, RefreshCw } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const colorMap = {
  'ดำ': 'bg-gray-900',
  'ขาว': 'bg-gray-100',
  'ทอง': 'bg-yellow-500',
  'ดำ-แดง': 'bg-gradient-to-r from-gray-900 to-red-600',
  'ขาว-น้ำเงิน': 'bg-gradient-to-r from-gray-100 to-blue-600',
  'เทา-ส้ม': 'bg-gradient-to-r from-gray-400 to-orange-500',
  'แดง': 'bg-red-600',
  'น้ำเงิน': 'bg-blue-600',
  'เทา': 'bg-gray-400',
};
const colorOptions = Object.keys(colorMap);
const shoeSizes = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
const clothSizes = ['S', 'M', 'L', 'XL', 'XXL'];

export default function InventoryManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '',
    imageUrl: '',
    colors: [],
    colorImages: {},
    sizes: [],
    details: { material: '', features: '', usage: '' }
  });
  const [isSaving, setIsSaving] = useState(false);

  // SweetAlert2 helpers
  const showAlert = (title, message, type = 'success') => {
    return Swal.fire({
      title: title,
      text: message,
      icon: type,
      confirmButtonColor: '#f97316',
      confirmButtonText: 'ตกลง',
      timer: type === 'success' ? 3000 : undefined,
      timerProgressBar: type === 'success',
    });
  };

  const showConfirm = (title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') => {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
    });
  };

  // ============ โหลดข้อมูล ============
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 กำลังโหลดข้อมูลสินค้า...');
      
      const invData = await inventoryService.getInventory();
      console.log('✅ Inventory Data:', invData);
      setInventory(invData || []);
      
      try {
        const catData = await productService.getCategories();
        console.log('✅ Categories Data:', catData);
        setCategories(catData || []);
      } catch (catErr) {
        console.warn('⚠️ โหลดหมวดหมู่ไม่ได้:', catErr);
        setCategories([]);
      }
      
      if (!invData || invData.length === 0) {
        setError('⚠️ ไม่พบสินค้าในคลัง');
      }
      
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err.response?.data?.error || err.message || 'โหลดข้อมูลล้มเหลว');
      setInventory([]);
      await showAlert('❌ โหลดข้อมูลล้มเหลว', err.response?.data?.error || 'ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============ Modal ============
  const handleOpenModal = async (mode, product = null) => {
    setModalMode(mode);
    setError('');
    
    if (mode === 'edit' && product) {
      setSelectedProduct(product);
      
      // ดึงข้อมูลเต็มจาก API เพื่อให้ได้ categoryId ที่ถูกต้อง
      try {
        const fullProduct = await productService.getById(product.id);
        console.log('📦 Full Product:', fullProduct);
        
        setFormData({
          name: fullProduct.name || '',
          description: fullProduct.description || '',
          price: fullProduct.price || '',
          categoryId: fullProduct.categoryId || '',
          stock: fullProduct.stock || '',
          imageUrl: fullProduct.imageUrl || '',
          colors: fullProduct.colors || [],
          colorImages: fullProduct.colorImages || {},
          sizes: fullProduct.sizes || [],
          details: fullProduct.details || { material: '', features: '', usage: '' }
        });
      } catch (err) {
        console.error('Error fetching product detail:', err);
        // ใช้ข้อมูลจาก product ที่มีอยู่
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          categoryId: product.categoryId || '',
          stock: product.stock || '',
          imageUrl: product.imageUrl || '',
          colors: product.colors || [],
          colorImages: product.colorImages || {},
          sizes: product.sizes || [],
          details: product.details || { material: '', features: '', usage: '' }
        });
      }
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: categories.length > 0 ? categories[0]?.id || '' : '',
        stock: '',
        imageUrl: '',
        colors: [],
        colorImages: {},
        sizes: [],
        details: { material: '', features: '', usage: '' }
      });
    }
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // ============ Form ============
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['material', 'features', 'usage'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        details: { ...prev.details, [name]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['price', 'stock', 'categoryId'].includes(name) ? Number(value) || 0 : value
      }));
    }
  };

  const toggleColor = (color) => {
    setFormData(prev => {
      const newColors = prev.colors.includes(color) 
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color];
      
      // ถ้าลบสี ให้ลบ colorImages ของสีนั้นด้วย
      const newColorImages = { ...prev.colorImages };
      if (!newColors.includes(color)) {
        delete newColorImages[color];
      }
      
      return {
        ...prev,
        colors: newColors,
        colorImages: newColorImages
      };
    });
  };

  const toggleSize = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorImageChange = (color, url) => {
    setFormData(prev => ({
      ...prev,
      colorImages: { ...prev.colorImages, [color]: url }
    }));
  };

  // ============ Submit ============
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    // ตรวจสอบว่าต้องเลือกหมวดหมู่
    if (!formData.categoryId) {
      setError('กรุณาเลือกหมวดหมู่');
      setIsSaving(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        await inventoryService.createProduct(formData);
        await showAlert('✅ เพิ่มสินค้าสำเร็จ', `สินค้า "${formData.name}" ถูกเพิ่มเข้าสู่ระบบแล้ว`, 'success');
      } else {
        await inventoryService.updateProduct(selectedProduct.id, formData);
        
        if (parseInt(formData.stock) !== selectedProduct.stock) {
          await inventoryService.updateStock(selectedProduct.id, {
            stock: parseInt(formData.stock),
            reason: `อัปเดตสต็อกจากหน้า Inventory`
          });
        }
        await showAlert('✅ อัปเดตสินค้าสำเร็จ', `สินค้า "${formData.name}" ถูกอัปเดตเรียบร้อย`, 'success');
      }
      
      await fetchData();
      handleCloseModal();
    } catch (err) {
      console.error('❌ Save error:', err);
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      await showAlert('❌ บันทึกไม่สำเร็จ', err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ============ Delete ============
  const handleDeleteProduct = async (id, name) => {
    const result = await showConfirm(
      'ยืนยันการลบสินค้า',
      `คุณต้องการลบสินค้า "${name}" ใช่หรือไม่? (การดำเนินการนี้ไม่สามารถย้อนกลับได้)`,
      'ยืนยัน',
      'ยกเลิก'
    );
    
    if (!result.isConfirmed) return;
    
    try {
      await inventoryService.deleteProduct(id);
      await showAlert('✅ ลบสินค้าสำเร็จ', `สินค้า "${name}" ถูกลบออกจากระบบแล้ว`, 'success');
      await fetchData();
    } catch (err) {
      await showAlert('❌ ลบไม่สำเร็จ', err.response?.data?.error || 'ไม่สามารถลบสินค้าได้', 'error');
    }
  };

  // ============ Filter ============
  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============ Render ============
  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  // หาชื่อหมวดหมู่จาก categoryId
  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === parseInt(categoryId));
    return cat ? cat.name : '';
  };

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2">📦 จัดการคลังสินค้าและสต็อก</h1>
            <Link to={isAdmin ? "/admin" : "/staff"} className="text-sports-red hover:text-red-400 text-sm">
              &larr; กลับหน้าหลัก
            </Link>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition flex items-center gap-2"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => handleOpenModal('create')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold">❌ {error}</p>
            </div>
            <button onClick={fetchData} className="px-4 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition">
              ลองใหม่
            </button>
          </div>
        )}

        {/* Search */}
        <div className="glass-card mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาสินค้าด้วยชื่อ..."
              className="w-full bg-transparent border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-sports-red transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Inventory List */}
        <div className="glass-card overflow-hidden">
          {inventory.length === 0 && !error ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">ยังไม่มีสินค้าในคลัง</p>
              <p className="text-gray-500 text-sm mt-1">คลิกปุ่ม "เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</p>
              <button 
                onClick={() => handleOpenModal('create')}
                className="btn-primary mt-4 inline-flex items-center gap-2"
              >
                <Plus size={20} /> เพิ่มสินค้าชิ้นแรก
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/40 border-b border-gray-800">
                    <th className="p-4 font-bold text-gray-400">รหัส</th>
                    <th className="p-4 font-bold text-gray-400">ชื่อสินค้า</th>
                    <th className="p-4 font-bold text-gray-400">หมวดหมู่</th>
                    <th className="p-4 font-bold text-gray-400">ราคา</th>
                    <th className="p-4 font-bold text-gray-400">สต็อก</th>
                    <th className="p-4 font-bold text-gray-400 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-gray-400">#{item.id}</td>
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4">
                        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs">
                          {item.category || 'อื่นๆ'}
                        </span>
                      </td>
                      <td className="p-4 text-sports-red">฿{item.price?.toLocaleString() || 0}</td>
                      <td className="p-4">
                        <span className={`font-bold ${item.stock < 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {item.stock || 0} ชิ้น
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleOpenModal('edit', item)}
                            className="text-blue-400 hover:text-blue-300 p-2 bg-blue-500/10 rounded-lg transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit size={18} />
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteProduct(item.id, item.name)}
                              className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg transition-colors"
                              title="ลบสินค้า"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        ไม่พบสินค้าที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          แสดง {filteredInventory.length} จากทั้งหมด {inventory.length} รายการ
        </p>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1c1f2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-[#1c1f2e] border-b border-white/10 p-6 flex items-center gap-3 z-10">
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <X size={20} />
                </button>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {modalMode === 'create' ? (
                      <><Package className="text-sports-red" size={24} /> เพิ่มสินค้าใหม่</>
                    ) : (
                      <><Edit2 className="text-sports-red" size={24} /> แก้ไขสินค้า</>
                    )}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {modalMode === 'create' ? 'กรอกรายละเอียดสินค้าใหม่' : 'ปรับปรุงข้อมูลสินค้า'}
                  </p>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">ชื่อสินค้า *</label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="เช่น Nike Air Max"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">คำอธิบาย</label>
                      <textarea 
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="รายละเอียดสินค้า"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">หมวดหมู่ *</label>
                      <select 
                        name="categoryId"
                        required
                        value={formData.categoryId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                      >
                        <option value="" className="bg-[#1c1f2e] text-white">เลือกหมวดหมู่...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#1c1f2e] text-white">
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                      {/* แสดงหมวดหมู่ปัจจุบัน (กรณีแก้ไข) */}
                      {modalMode === 'edit' && formData.categoryId && (
                        <p className="text-xs text-gray-400 mt-1">
                          หมวดหมู่ปัจจุบัน: <span className="text-sports-red">{getCategoryName(formData.categoryId)}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">ราคา (บาท) *</label>
                      <input 
                        type="number" 
                        name="price"
                        required
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="2990"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">จำนวนสต็อก *</label>
                      <input 
                        type="number" 
                        name="stock"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">URL รูปภาพ</label>
                      <input 
                        type="text" 
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="border-t border-gray-800 pt-4">
                    <label className="text-gray-400 text-sm font-medium block mb-3">สีที่มีจำหน่าย</label>
                    <div className="flex gap-3 flex-wrap">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => toggleColor(color)}
                          className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                            formData.colors.includes(color)
                              ? 'border-sports-red ring-2 ring-sports-red/50 ring-offset-2 ring-offset-gray-900'
                              : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          <div className={`w-full h-full rounded-full ${colorMap[color]}`}></div>
                          {formData.colors.includes(color) && (
                            <Check size={14} className="absolute -top-1 -right-1 text-sports-red bg-sports-dark rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                    {formData.colors.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">เลือกแล้ว {formData.colors.length} สี</p>
                    )}
                  </div>

                  {/* Color Images */}
                  {formData.colors.length > 0 && (
                    <div className="border-t border-gray-800 pt-4 space-y-3">
                      <label className="block text-sm font-medium text-gray-300">URL รูปภาพแต่ละสี</label>
                      {formData.colors.map(color => (
                        <div key={color} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full ${colorMap[color] || 'bg-gray-500'}`}></div>
                          <span className="text-sm text-gray-400 w-20">{color}</span>
                          <input
                            type="text"
                            placeholder={`URL รูป ${color}`}
                            value={formData.colorImages?.[color] || ''}
                            onChange={(e) => handleColorImageChange(color, e.target.value)}
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sizes */}
                  <div className="border-t border-gray-800 pt-4">
                    <label className="text-gray-400 text-sm font-medium block mb-3">ขนาดที่มีจำหน่าย</label>
                    <div className="flex gap-2 flex-wrap">
                      {shoeSizes.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            formData.sizes.includes(size)
                              ? 'border-sports-red bg-sports-red/10 text-white font-bold'
                              : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {formData.sizes.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">เลือกแล้ว {formData.sizes.length} ขนาด</p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="border-t border-gray-800 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">วัสดุ</label>
                      <input 
                        type="text" 
                        name="material"
                        value={formData.details.material}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="เช่น ผ้าตาข่าย"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">คุณสมบัติ</label>
                      <input 
                        type="text" 
                        name="features"
                        value={formData.details.features}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="เช่น ระบายอากาศดี"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">วิธีใช้</label>
                      <input 
                        type="text" 
                        name="usage"
                        value={formData.details.usage}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:ring-2 focus:ring-sports-red/30 focus:outline-none transition"
                        placeholder="เช่น วิ่งระยะไกล"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 py-3 bg-sports-red text-white rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save size={20} />
                      {isSaving ? 'กำลังบันทึก...' : (modalMode === 'create' ? 'บันทึกข้อมูล' : 'อัปเดตข้อมูล')}
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCloseModal}
                      className="flex-1 py-3 border border-white/20 text-gray-400 rounded-lg font-semibold hover:bg-white/5 transition"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}