import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag } from 'lucide-react';
import Swal from 'sweetalert2';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const showAlert = (title, message, type = 'success') => {
    return Swal.fire({
      title: title,
      text: message,
      icon: type,
      confirmButtonColor: '#f97316',
      confirmButtonText: 'ตกลง',
      timer: type === 'success' ? 2000 : undefined,
      timerProgressBar: type === 'success',
    });
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      await showAlert(
        '⚠️ กรุณาเข้าสู่ระบบ',
        'คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถหยิบสินค้าลงตะกร้าได้',
        'warning'
      );
      return;
    }
    
    try {
      await addToCart(product.id, 1);
      await showAlert(
        '✅ เพิ่มสินค้าสำเร็จ',
        `เพิ่ม ${product.name} ลงตะกร้าแล้ว!`,
        'success'
      );
    } catch (error) {
      await showAlert(
        '❌ เกิดข้อผิดพลาด',
        error.response?.data?.error || 'ไม่สามารถเพิ่มสินค้าลงตะกร้าได้ กรุณาลองใหม่อีกครั้ง',
        'error'
      );
    }
  };

  const imageUrl = product.imageUrl || '';

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 group overflow-hidden">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center text-gray-400';
                fallback.innerHTML = `
                  <div class="text-center">
                    <div class="text-4xl mb-2">📷</div>
                    <p class="text-sm font-medium">ไม่มีรูปภาพ</p>
                  </div>
                `;
                parent.appendChild(fallback);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm font-medium">ไม่มีรูปภาพ</p>
              </div>
            </div>
          )}
          {product.stock === 0 && (
            <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              สินค้าหมด
            </span>
          )}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 right-4 w-11 h-11 bg-white rounded-full flex items-center justify-center text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:text-white shadow-lg hover:shadow-xl"
            disabled={product.stock === 0}
          >
            <ShoppingBag size={20} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">{product.category || 'ทั่วไป'}</p>
          <h3 className="font-bold text-lg text-gray-900 hover:text-red-600 transition line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xl font-bold text-red-600">฿ {product.price?.toLocaleString()}</span>
            {product.oldPrice && (
              <span className="text-gray-400 line-through text-sm">฿ {product.oldPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
