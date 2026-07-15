import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cartItems, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
        <div className="container text-center py-20">
          <ShoppingCart size={64} className="mx-auto text-white/20 mb-4" />
          <h2 className="text-2xl font-bold mb-4">กรุณาเข้าสู่ระบบ</h2>
          <Link to="/login" className="btn-primary">เข้าสู่ระบบ</Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
        <div className="container text-center py-20">
          <ShoppingCart size={64} className="mx-auto text-white/20 mb-4" />
          <h2 className="text-2xl font-bold mb-4">ตะกร้าสินค้าว่างเปล่า</h2>
          <p className="text-gray-400 mb-6">เริ่มเลือกซื้อสินค้าคุณภาพจากเรา</p>
          <Link to="/products" className="btn-primary">เริ่มช้อปปิ้ง</Link>
        </div>
      </div>
    );
  }

  const shippingFee = 50;
  const total = totalPrice + shippingFee;

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6 mb-8">
          <h1 className="text-3xl font-black">🛒 ตะกร้าสินค้า</h1>
          <span className="text-sports-red text-xl font-bold">({totalItems})</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="glass-card flex gap-4 items-center">
                <div className="w-24 h-24 rounded-lg flex-shrink-0 bg-gradient-to-br from-sports-navy to-sports-dark/50 flex items-center justify-center text-3xl overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    ['👟', '⚽', '🏀', '🎾', '🏃', '💪'][(item.productId || item.id) % 6] || '👟'
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{item.name || item.product?.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {item.category || item.product?.category || 'ทั่วไป'}
                        {item.color && <span> • สี: {item.color}</span>}
                        {item.size && <span> • ไซส์: {item.size}</span>}
                      </p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-1 glass rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1.5 hover:text-sports-red transition">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1.5 hover:text-sports-red transition">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xl font-bold text-sports-red">
                      ฿ {((item.price || item.product?.price || 0) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24">
            <div className="glass-card">
              <h2 className="text-xl font-bold mb-6">สรุปคำสั่งซื้อ</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-400">
                  <span>สินค้า ({totalItems} ชิ้น)</span>
                  <span>฿ {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>ค่าจัดส่ง</span>
                  <span>฿ {shippingFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>ยอดรวม</span>
                    <span className="text-sports-red">฿ {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Link to="/checkout" className="btn-primary w-full justify-center mt-6">
                ดำเนินการชำระเงิน <ArrowRight size={18} />
              </Link>
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-sm">
                <ShieldCheck size={16} className="text-green-400" />
                <span>รับประกันการชำระเงินปลอดภัย 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}