import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { Eye, Package, Calendar, CreditCard, MapPin } from 'lucide-react';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderService.getAll();
        setOrders(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
        <div className="container text-center py-20">
          <h2 className="text-2xl font-bold mb-4">กรุณาเข้าสู่ระบบ</h2>
          <Link to="/login" className="btn-primary">เข้าสู่ระบบ</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      shipped: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      delivered: 'bg-green-500/20 text-green-500 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
    };
    return badges[status] || 'bg-gray-500/20 text-gray-500 border-gray-500/30';
  };

  const getStatusLabel = (status) => {
    const labels = { 
      pending: '⏳ รอดำเนินการ', 
      processing: '🔄 กำลังดำเนินการ', 
      shipped: '📦 จัดส่งแล้ว', 
      delivered: '✅ จัดส่งสำเร็จ', 
      cancelled: '❌ ยกเลิก' 
    };
    return labels[status] || status;
  };

  const getPaymentLabel = (method) => {
    const methods = {
      promptpay: 'QR PromptPay',
      credit: 'บัตรเครดิต/เดบิต',
      cod: 'เก็บเงินปลายทาง',
      bank_transfer: 'โอนเงินผ่านธนาคาร'
    };
    return methods[method] || method;
  };

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Package size={28} className="text-sports-red" />
          <h1 className="text-3xl font-black">📋 ประวัติการสั่งซื้อ</h1>
          <span className="text-sm text-gray-400 ml-auto">({orders.length} รายการ)</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">ยังไม่มีประวัติการสั่งซื้อ</p>
            <Link to="/products" className="btn-primary mt-4 inline-block">เริ่มช้อปปิ้ง</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="glass-card hover:border-sports-red/30 transition">

                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-400">คำสั่งซื้อ</p>
                      <p className="font-bold text-white">#ORD-{order.id}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {order.orderDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={14} /> {getPaymentLabel(order.paymentMethod)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="text-xl font-bold text-sports-red">
                      ฿ {order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>


                <div className="border-t border-white/10 mt-3 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>สินค้า:</span>
                      <span className="text-white">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <span key={idx}>
                            {item.product?.name || `สินค้า #${item.productId}`}
                            {idx < order.items.length - 1 && ', '}
                          </span>
                        ))}
                        {order.items?.length > 2 && ` +${order.items.length - 2} รายการ`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {order.slipImage && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          ✅ มีสลิป
                        </span>
                      )}
                      <Link 
                        to={`/order/${order.id}`} 
                        className="flex items-center gap-1.5 px-4 py-2 glass rounded-lg hover:bg-sports-red/20 hover:border-sports-red/50 transition text-sm font-semibold"
                      >
                        <Eye size={16} /> ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                </div>


                <div className="border-t border-white/5 mt-3 pt-3">
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{order.shippingAddress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}