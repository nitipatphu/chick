import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { categoryService } from '../../services/categoryService';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '', icon: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้', 'error');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setCurrentCategory({ name: '', icon: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setCurrentCategory({ ...category });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await categoryService.deleteCategory(id);
        await Swal.fire('สำเร็จ', 'ลบหมวดหมู่เรียบร้อยแล้ว', 'success');
        fetchCategories();
      } catch (error) {
        Swal.fire('ข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถลบหมวดหมู่ได้', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await categoryService.updateCategory(currentCategory.id, currentCategory);
        await Swal.fire('สำเร็จ', 'อัปเดตหมวดหมู่เรียบร้อยแล้ว', 'success');
      } else {
        await categoryService.createCategory(currentCategory);
        await Swal.fire('สำเร็จ', 'เพิ่มหมวดหมู่เรียบร้อยแล้ว', 'success');
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      Swal.fire('ข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Tag className="text-sports-red" size={32} />
            จัดการหมวดหมู่สินค้า
          </h1>
          <p className="text-gray-400 mt-2">เพิ่ม แก้ไข หรือลบหมวดหมู่สินค้าในระบบ</p>
        </div>
        
        <button 
          onClick={handleAdd}
          className="btn-primary whitespace-nowrap"
        >
          <Plus size={20} />
          เพิ่มหมวดหมู่ใหม่
        </button>
      </div>

      <div className="glass-card mb-8">
        <div className="flex items-center gap-3 mb-6 bg-sports-dark/50 border border-white/10 rounded-xl px-4 py-3 focus-within:border-sports-red transition-colors">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-24">ID</th>
                <th className="p-4 font-semibold">ชื่อหมวดหมู่</th>
                <th className="p-4 font-semibold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCategories.map(category => (
                <tr key={category.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-gray-400 font-mono text-sm">{category.id}</td>
                  <td className="p-4 font-bold text-white text-lg">{category.name}</td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => handleEdit(category)}
                      className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                      title="แก้ไข"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id, category.name)}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                      title="ลบ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    ไม่พบข้อมูลหมวดหมู่
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-sports-dark border border-gray-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                {isEditing ? '✏️ แก้ไขหมวดหมู่' : '✨ เพิ่มหมวดหมู่ใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ชื่อหมวดหมู่ <span className="text-sports-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currentCategory.name}
                  onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})}
                  className="input-field"
                  placeholder="เช่น รองเท้า, อุปกรณ์ฟิตเนส"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-sports-red hover:bg-red-600 text-white rounded-lg font-bold transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
