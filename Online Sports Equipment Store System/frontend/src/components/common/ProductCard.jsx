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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-200">
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    <div class="text-center">
                      <div class="text-4xl mb-2">📷</div>
                      <p>ไม่มีรูปภาพ</p>
                    </div>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm">ไม่มีรูปภาพ</p>
              </div>
            </div>
          )}
          {product.stock === 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              สินค้าหมด
            </span>
          )}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 right-4 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 opacity-0 group-hover:opacity-100 transition-all hover:bg-sports-red hover:text-white"
            disabled={product.stock === 0}
          >
            <ShoppingBag size={20} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider">{product.category || 'ทั่วไป'}</p>
          <h3 className="font-semibold text-lg hover:text-sports-red transition">{product.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xl font-bold text-sports-red">฿ {product.price?.toLocaleString()}</span>
            {product.oldPrice && (
              <span className="text-gray-500 line-through text-sm">฿ {product.oldPrice.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
