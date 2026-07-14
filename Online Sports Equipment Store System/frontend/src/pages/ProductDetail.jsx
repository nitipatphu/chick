import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Minus, Plus, Check } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [currentImage, setCurrentImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productService.getById(id);
        setProduct(data);

        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);

          if (data.colorImages && data.colorImages[data.colors[0]]) {
            setCurrentImage(data.colorImages[data.colors[0]]);
          } else {
            setCurrentImage(data.imageUrl);
          }
        } else {
          setCurrentImage(data.imageUrl);
        }
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (error) {
        console.error('Error:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);


  const handleColorChange = (color) => {
    setSelectedColor(color);
    if (product.colorImages && product.colorImages[color]) {
      setCurrentImage(product.colorImages[color]);
    } else {
      setCurrentImage(product.imageUrl);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      navigate('/login');
      return;
    }
    try {
      await addToCart({
        productId: product.id,
        quantity: quantity,
        color: selectedColor,
        size: selectedSize,
        price: product.price,
        name: product.name,
        image: currentImage
      });
      alert('เพิ่มสินค้าลงตะกร้าเรียบร้อย!');
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      navigate('/login');
      return;
    }
    try {
      await addToCart({
        productId: product.id,
        quantity: quantity,
        color: selectedColor,
        size: selectedSize,
        price: product.price,
        name: product.name,
        image: currentImage
      });
      navigate('/cart');
    } catch (error) {
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-sports-dark text-white pt-20 flex items-center justify-center">
        <p className="text-gray-400">ไม่พบสินค้า</p>
      </div>
    );
  }


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

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container">

        <div className="text-sm text-gray-400 mb-6">
          <span>หน้าแรก</span>
          <span className="mx-2">›</span>
          <span>สินค้า</span>
          <span className="mx-2">›</span>
          <span className="text-sports-red">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      
          <div className="aspect-square rounded-2xl overflow-hidden bg-sports-navy">
            <img 
              src={currentImage || product.imageUrl || 'https://via.placeholder.com/600x600?text=No+Image'} 
              alt={`${product.name} - ${selectedColor}`}
              className="w-full h-full object-cover transition-all duration-300"
            />
      
            {selectedColor && (
              <div className="text-center text-sm text-gray-400 mt-2">
                สี: {selectedColor}
              </div>
            )}
          </div>

    
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider">{product.category || 'ทั่วไป'}</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">{product.name}</h1>
            

            <div className="mt-4">
              <span className="text-3xl font-bold text-sports-red">฿ {product.price?.toLocaleString()}</span>
              {product.oldPrice && (
                <span className="text-gray-500 line-through text-lg ml-3">฿ {product.oldPrice.toLocaleString()}</span>
              )}
            </div>

            <p className="text-gray-400 mt-4 leading-relaxed">{product.description}</p>


            {product.colors && product.colors.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  สี (Color) <span className="text-sports-red ml-2">{selectedColor}</span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color 
                          ? 'border-sports-red ring-2 ring-sports-red/50 ring-offset-2 ring-offset-sports-dark' 
                          : 'border-white/20 hover:border-white/50'
                      }`}
                    >
                      <div className={`w-full h-full rounded-full ${colorMap[color] || 'bg-gray-500'}`}></div>
                      {selectedColor === color && (
                        <Check size={14} className="absolute -top-1 -right-1 text-sports-red bg-sports-dark rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  ขนาด (Size) <span className="text-sports-red ml-2">{selectedSize}</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedSize === size 
                          ? 'border-sports-red bg-sports-red/10 text-white' 
                          : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">จำนวน</label>
              <div className="flex items-center gap-2 glass rounded-lg w-32">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="px-4 py-2 hover:text-sports-red transition"
                >
                  <Minus size={18} />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)} 
                  className="px-4 py-2 hover:text-sports-red transition"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={handleBuyNow}
                className="flex-1 btn-primary justify-center text-lg py-3"
              >
                ซื้อทันที
              </button>
              <button 
                onClick={handleAddToCart}
                className="flex-1 btn-outline justify-center text-lg py-3"
              >
                เพิ่มลงตะกร้า
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="font-bold text-lg mb-3">รายละเอียดสินค้า</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                {product.details?.material && <li>• วัสดุ: {product.details.material}</li>}
                {product.details?.features && <li>• คุณสมบัติ: {product.details.features}</li>}
                {product.details?.usage && <li>• วิธีใช้: {product.details.usage}</li>}
                {(!product.details || (!product.details.material && !product.details.features && !product.details.usage)) && (
                  <li>ไม่มีข้อมูลรายละเอียดเพิ่มเติม</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}