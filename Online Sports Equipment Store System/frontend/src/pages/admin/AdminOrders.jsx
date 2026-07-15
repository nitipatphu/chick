// frontend/src/pages/admin/AdminOrders.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { uploadService } from '../../services/uploadService';
import Swal from 'sweetalert2';

const STATUS_BADGE = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  shipped: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  delivered: 'bg-green-500/20 text-green-500 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
  returned: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
};
const STATUS_LABEL = {
  pending: 'รอดำเนินการ',
  processing: 'กำลังเตรียมจัดส่ง',
  shipped: 'จัดส่งแล้ว',
  delivered: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิกแล้ว',
  returned: 'พัสดุตีกลับ',
};
const PAYMENT_LABEL = {
  cash_on_delivery: 'เก็บเงินปลายทาง',
  promptpay: 'PromptPay (โอนผ่าน QR)',
  bank_transfer: 'โอนผ่านธนาคาร',
  credit_card: 'บัตรเครดิต',
  credit: 'บัตรเครดิต',
  cod: 'เก็บเงินปลายทาง'
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingCourier, setTrackingCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError('');
      const data = await orderService.getAdminOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setError('โหลดข้อมูลคำสั่งซื้อล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

  function handleViewDetail(order) {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingCourier(order.trackingCourier || '');
    setTrackingNumber(order.trackingNumber || '');
    setShowModal(true);
  }

  function handleCloseDetail() {
    setSelectedOrder(null);
    setShowModal(false);
    setTrackingCourier('');
    setTrackingNumber('');
  }

  async function handleConfirmPayment(orderId) {
    const result = await Swal.fire({
      title: 'ยืนยันการชำระเงิน',
      text: 'คุณต้องการยืนยันว่าลูกค้าชำระเงินเรียบร้อยแล้ว?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ ยืนยันชำระแล้ว',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
      await uploadService.confirmPayment(orderId);
      await Swal.fire('✅ ยืนยันการชำระเงินสำเร็จ', 'สถานะคำสั่งซื้อถูกอัปเดตเป็น "กำลังเตรียมจัดส่ง"', 'success');
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetail(orders.find(o => o.id === orderId));
      }
    } catch (error) {
      await Swal.fire('❌ เกิดข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถยืนยันการชำระได้', 'error');
    }
  }

  async function handleRejectPayment(orderId) {
    const result = await Swal.fire({
      title: 'ปฏิเสธสลิปและยกเลิกคำสั่งซื้อ',
      html: `
        <div class="text-left">
          <p class="mb-2 text-red-600 font-bold">⚠️ คุณกำลังจะปฏิเสธสลิปนี้</p>
          <p class="text-sm text-gray-500">คำสั่งซื้อนี้จะถูกยกเลิกทันที</p>
          <p class="text-sm text-gray-400 mt-2">ลูกค้าจะได้รับแจ้งและต้องสั่งซื้อใหม่</p>
        </div>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ ยืนยันปฏิเสธและยกเลิก',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
      await uploadService.rejectPayment(orderId);
      await Swal.fire('✅ ปฏิเสธสลิปและยกเลิกคำสั่งซื้อสำเร็จ', `คำสั่งซื้อ #${orderId} ถูกยกเลิก`, 'success');
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleViewDetail(orders.find(o => o.id === orderId));
      }
    } catch (error) {
      await Swal.fire('❌ เกิดข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถยกเลิกคำสั่งซื้อได้', 'error');
    }
  }

  const canChangeStatus = (order) => {
    if (!order) return false;
    if (order.status === 'cancelled') return false;
    if (order.status === 'delivered') return false;
    if (order.paymentMethod === 'cod') return true;
    if (order.paymentMethod === 'promptpay' || order.paymentMethod === 'bank_transfer') {
      if (order.slipImage && !order.paymentConfirmed) {
        return false;
      }
    }
    return true;
  };

  const getStatusChangeMessage = (order) => {
    if (!order) return '';
    if (order.slipImage && !order.paymentConfirmed) {
      return '⚠️ กรุณายืนยันสลิปการโอนเงินก่อน หรือใช้ปุ่ม "ปฏิเสธ" เพื่อยกเลิกคำสั่งซื้อ';
    }
    return '';
  };

  async function handleStatusChangeSubmit(e) {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!canChangeStatus(selectedOrder)) {
      await Swal.fire({
        title: '⚠️ ไม่สามารถเปลี่ยนสถานะได้',
        text: getStatusChangeMessage(selectedOrder) || 'คำสั่งซื้อนี้ถูกยกเลิกหรือจัดส่งแล้ว',
        icon: 'warning',
        confirmButtonColor: '#f97316',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะ',
      text: `คุณต้องการเปลี่ยนสถานะคำสั่งซื้อ #${selectedOrder.id} จาก "${STATUS_LABEL[selectedOrder.status]}" เป็น "${STATUS_LABEL[newStatus]}" ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (!result.isConfirmed) return;

    try {
      setUpdatingStatus(true);
      let updateData = { status: newStatus };
      if (newStatus === 'shipped') {
        updateData.trackingCourier = trackingCourier;
        updateData.trackingNumber = trackingNumber;
      }
      const res = await orderService.updateOrderStatus(selectedOrder.id, updateData);
      if (res.success || res.order) {
        setOrders(orders.map(o => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o)));
        setSelectedOrder({ ...selectedOrder, status: newStatus });
        await Swal.fire('✅ อัปเดตสถานะคำสั่งซื้อเรียบร้อยแล้ว', '', 'success');
        loadOrders();
      } else {
        await Swal.fire('❌ ไม่สามารถอัปเดตสถานะได้', res.error || '', 'error');
      }
    } catch (err) {
      console.error(err);
      await Swal.fire('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', '', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const processingOrShippedCount = orders.filter(o => o.status === 'processing' || o.status === 'shipped').length;
  const completedOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const filteredOrders = orders.filter(order => {
    if (activeTab !== 'all' && order.status !== activeTab) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return [
      String(order.id),
      order.fullName || '',
      order.user?.fullName || '',
      order.user?.email || '',
      order.note || '',
      order.shippingAddress || '',
    ].some(field => String(field).toLowerCase().includes(term));
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'amount_desc') return (b.totalAmount || 0) - (a.totalAmount || 0);
    if (sortBy === 'amount_asc') return (a.totalAmount || 0) - (b.totalAmount || 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container max-w-7xl mx-auto px-4">
        <Link to="/admin" className="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-1 transition">
          &larr; กลับแผงควบคุม
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black">📋 จัดการคำสั่งซื้อ</h1>
          <p className="text-gray-400 text-sm mt-1">ดูประวัติ รายละเอียด และแก้ไขสถานะรายการจัดส่งสินค้าของลูกค้า</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="glass-card p-5 text-center">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">คำสั่งซื้อทั้งหมด</p>
            <p className="text-2xl font-black mt-2 text-white">{totalOrdersCount} รายการ</p>
          </div>
          <div className="glass-card p-5 text-center border-yellow-500/30">
            <p className="text-yellow-500 text-xs font-semibold uppercase tracking-wider">รอดำเนินการ</p>
            <p className="text-2xl font-black mt-2 text-yellow-500">{pendingOrdersCount} รายการ</p>
          </div>
          <div className="glass-card p-5 text-center border-blue-400/30">
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">กำลังเตรียม / จัดส่ง</p>
            <p className="text-2xl font-black mt-2 text-blue-400">{processingOrShippedCount} รายการ</p>
          </div>
          <div className="glass-card p-5 text-center border-green-500/30">
            <p className="text-green-500 text-xs font-semibold uppercase tracking-wider">จัดส่งสำเร็จ</p>
            <p className="text-2xl font-black mt-2 text-green-500">{completedOrdersCount} รายการ</p>
          </div>
          <div className="glass-card p-5 text-center border-sports-red/30">
            <p className="text-sports-red text-xs font-semibold uppercase tracking-wider">ยอดขายรวม</p>
            <p className="text-2xl font-black mt-2 text-sports-red">฿{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card p-6 mb-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหา เลขคำสั่งซื้อ, ชื่อลูกค้า, อีเมล..."
                className="w-full pl-4 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-sports-red focus:outline-none text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-gray-400 text-sm whitespace-nowrap">เรียงลำดับ:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg text-white py-2 px-3 text-sm focus:border-sports-red focus:outline-none"
              >
                <option value="newest">ล่าสุด (ใหม่สุด)</option>
                <option value="oldest">เก่าที่สุด</option>
                <option value="amount_desc">ยอดชำระมากสุด</option>
                <option value="amount_asc">ยอดชำระน้อยสุด</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'pending', label: '⏳ รอดำเนินการ' },
              { id: 'processing', label: '🔄 กำลังเตรียมจัดส่ง' },
              { id: 'shipped', label: '📦 จัดส่งแล้ว' },
              { id: 'delivered', label: '✅ สำเร็จ' },
              { id: 'cancelled', label: '❌ ยกเลิก' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${activeTab === tab.id
                  ? 'bg-sports-red text-white border-sports-red'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-gray-400 text-sm">
                  <th className="px-6 py-4 font-bold">เลขคำสั่งซื้อ</th>
                  <th className="px-6 py-4 font-bold">วันที่</th>
                  <th className="px-6 py-4 font-bold">ลูกค้า</th>
                  <th className="px-6 py-4 font-bold">ยอดสุทธิ</th>
                  <th className="px-6 py-4 font-bold">ช่องทางชำระ</th>
                  <th className="px-6 py-4 font-bold text-center">สถานะ</th>
                  <th className="px-6 py-4 font-bold text-center">สลิป</th>
                  <th className="px-6 py-4 font-bold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-400">
                      ไม่พบรายการคำสั่งซื้อที่ค้นหา
                    </td>
                  </tr>
                ) : sortedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{order.orderDate}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{order.fullName || order.user?.fullName || 'ลูกค้าทั่วไป'}</div>
                      <div className="text-xs text-gray-400">{order.user?.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sports-red font-bold">฿{order.totalAmount?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[order.status] || 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                        }`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {order.slipImage ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs text-green-400">✅ มีสลิป</span>
                          {order.paymentConfirmed ? (
                            <span className="text-xs text-green-500 bg-green-500/20 px-2 py-0.5 rounded-full">ยืนยันแล้ว</span>
                          ) : (
                            <span className="text-xs text-yellow-500 bg-yellow-500/20 px-2 py-0.5 rounded-full">รอตรวจสอบ</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="px-4 py-1.5 bg-white/10 hover:bg-sports-red text-white rounded-lg text-sm transition-all"
                      >
                        จัดการรายการ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          แสดงรายการคำสั่งซื้อ {sortedOrders.length} จากทั้งหมด {orders.length} รายการ
        </p>
      </div>

      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="border border-gray-700 max-w-4xl w-full rounded-2xl overflow-hidden bg-sports-dark">
            <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white">📋 รายละเอียดคำสั่งซื้อ #{selectedOrder.id}</h3>
                <p className="text-xs text-gray-400 mt-0.5">ทำรายการเมื่อวันที่: {selectedOrder.orderDate}</p>
              </div>
              <button onClick={handleCloseDetail} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <h4 className="font-bold text-gray-300 border-b border-white/10 pb-2 flex justify-between items-center">
                  <span>รายการสินค้า</span>
                  <span className="text-xs text-sports-red">{selectedOrder.items?.length || 0} ชิ้น</span>
                </h4>
                <div className="space-y-3 overflow-y-auto pr-1 max-h-[50vh]">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                      <img
                        src={item.product?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                        alt={item.product?.name || ''}
                        className="w-16 h-16 object-cover rounded-lg bg-sports-navy border border-white/10"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h5 className="font-bold text-sm text-white line-clamp-1">{item.product?.name || 'สินค้าลบแล้ว'}</h5>
                          <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2">
                            {item.color && <span>สี: {item.color}</span>}
                            {item.size && <span>ไซส์: {item.size}</span>}
                            <span>ราคา: ฿{item.price?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-300 mt-1">
                          <span>จำนวน: x{item.quantity}</span>
                          <span className="font-semibold text-sports-red">฿{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>ยอดรวมสินค้า</span>
                    <span>฿{selectedOrder.totalAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>ค่าจัดส่ง</span>
                    <span className="text-green-400">ฟรี</span>
                  </div>
                  <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-bold text-white text-base">
                    <span>ยอดเงินสุทธิ</span>
                    <span className="text-sports-red">฿{selectedOrder.totalAmount?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-300 border-b border-white/10 pb-2">ข้อมูลลูกค้าและที่อยู่จัดส่ง</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">ชื่อลูกค้า: </span>
                      <span className="text-white font-medium">{selectedOrder.fullName || selectedOrder.user?.fullName || 'ไม่ระบุชื่อ'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">อีเมล: </span>
                      <span className="text-white">{selectedOrder.user?.email || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">เบอร์โทรศัพท์: </span>
                      <span className="text-white">{selectedOrder.phone || selectedOrder.user?.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">ช่องทางการจ่ายเงิน: </span>
                      <span className="text-white">{PAYMENT_LABEL[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 mt-2">
                      <p className="text-gray-400 text-xs mb-1">ที่อยู่จัดส่ง:</p>
                      <p className="text-white text-xs leading-relaxed">{selectedOrder.shippingAddress || 'ไม่ได้บันทึกที่อยู่'}</p>
                    </div>
                    {selectedOrder.slipImage && (
                      <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                        <p className="text-gray-400 text-xs mb-1">สลิปการโอน:</p>
                        <div className="flex justify-center">
                          <img src={selectedOrder.slipImage} alt="สลิป" className="max-h-48 rounded-lg" />
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-2">
                          {selectedOrder.paymentConfirmed ? (
                            <span className="text-green-400 text-sm flex items-center gap-1">✅ ยืนยันการชำระเงินแล้ว</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleConfirmPayment(selectedOrder.id)}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                              >
                                ✅ ยืนยัน
                              </button>
                              <button
                                onClick={() => handleRejectPayment(selectedOrder.id)}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
                              >
                                ❌ ปฏิเสธ
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedOrder.note && (
                      <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                        <p className="text-yellow-500 text-xs mb-1">หมายเหตุจากลูกค้า:</p>
                        <p className="text-white text-xs">{selectedOrder.note}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-300 border-b border-white/10 pb-2">จัดการสถานะคำสั่งซื้อ</h4>
                  <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">สถานะรายการปัจจุบัน:</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[selectedOrder.status] || ''}`}>
                        {STATUS_LABEL[selectedOrder.status] || selectedOrder.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="order-status-select" className="text-xs text-gray-400 block">เปลี่ยนสถานะเป็น:</label>
                      <select
                        id="order-status-select"
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg text-white py-2.5 px-3 focus:border-sports-red focus:outline-none text-sm"
                      >
                        <option className="bg-sports-navy text-white" value="pending">⏳ รอดำเนินการ (Pending)</option>
                        <option className="bg-sports-navy text-white" value="processing">🔄 กำลังเตรียมจัดส่ง (Processing)</option>
                        <option className="bg-sports-navy text-white" value="shipped">📦 จัดส่งแล้ว (Shipped)</option>
                        <option className="bg-sports-navy text-white" value="delivered">✅ จัดส่งสำเร็จ (Delivered)</option>
                        <option className="bg-sports-navy text-white" value="cancelled">❌ ยกเลิกแล้ว (Cancelled)</option>
                        <option className="bg-sports-navy text-white" value="returned">↩️ พัสดุตีกลับ (Returned)</option>
                      </select>
                      {newStatus === 'shipped' && (
                        <div className="mt-4 space-y-3 bg-white/5 p-3 rounded-lg border border-white/10">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">บริษัทขนส่ง (Courier):</label>
                            <input
                              type="text"
                              value={trackingCourier}
                              onChange={e => setTrackingCourier(e.target.value)}
                              placeholder="เช่น Kerry, Flash, J&T, EMS"
                              className="w-full bg-sports-dark border border-gray-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-sports-red"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">หมายเลขพัสดุ (Tracking Number):</label>
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={e => setTrackingNumber(e.target.value)}
                              placeholder="TH1234567890"
                              className="w-full bg-sports-dark border border-gray-700 rounded text-sm text-white px-3 py-2 focus:outline-none focus:border-sports-red"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const isTrackingModified = newStatus === 'shipped' && (
                        (trackingCourier || '') !== (selectedOrder.trackingCourier || '') ||
                        (trackingNumber || '') !== (selectedOrder.trackingNumber || '')
                      );
                      const isButtonDisabled = updatingStatus || (selectedOrder.status === newStatus && !isTrackingModified);
                      return (
                        <button
                          type="submit"
                          disabled={isButtonDisabled}
                          className={`w-full text-sm py-2 px-4 rounded-lg font-bold transition-all ${isButtonDisabled
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-sports-red text-white hover:bg-sports-orange'
                            }`}
                        >
                          {updatingStatus ? 'กำลังอัปเดต...' : (selectedOrder.status === newStatus && isTrackingModified ? '✏️ แก้ไขข้อมูลขนส่ง' : '💾 บันทึกสถานะใหม่')}
                        </button>
                      );
                    })()}
                  </form>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-white/5 border-t border-white/10">
              <button onClick={handleCloseDetail} className="px-5 py-2 text-sm bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-colors">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}