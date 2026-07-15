import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { settingsService } from '../services/settingsService';
import { uploadService } from '../services/uploadService';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, CheckCircle, Clock, Truck, Package, MapPin, 
  CreditCard, Banknote, QrCode, Upload, X, AlertCircle, 
  CheckCircle2, ShoppingBag, Trash2 
} from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bankSettings, setBankSettings] = useState({});
  const [slipImage, setSlipImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrder();
    loadSettings();
  }, [id, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getById(id);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      await showAlert('❌ ไม่พบคำสั่งซื้อ', 'ไม่พบคำสั่งซื้อที่คุณต้องการ', 'error');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getPublic();
      setBankSettings(settings || {});
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (order.status === 'delivered') {
      await showAlert(
        '❌ ไม่สามารถยกเลิกได้',
        'คำสั่งซื้อนี้จัดส่งแล้ว ไม่สามารถยกเลิกได้',
        'error'
      );
      return;
    }

    if (order.status === 'cancelled') {
      await showAlert(
        '⚠️ ยกเลิกไปแล้ว',
        'คำสั่งซื้อนี้ถูกยกเลิกไปแล้ว',
        'warning'
      );
      return;
    }

    const result = await showConfirm(
      'ยืนยันการยกเลิกคำสั่งซื้อ',
      `คุณต้องการยกเลิกคำสั่งซื้อ #${order.id} ใช่หรือไม่?\n(การดำเนินการนี้ไม่สามารถย้อนกลับได้)`,
      'ยืนยันยกเลิก',
      'ยกเลิก'
    );

    if (!result.isConfirmed) return;

    try {
      await orderService.cancelOrder(order.id);
      await showAlert(
        '✅ ยกเลิกคำสั่งซื้อสำเร็จ',
        `คำสั่งซื้อ #${order.id} ถูกยกเลิกเรียบร้อย`,
        'success'
      );
      fetchOrder();
    } catch (error) {
      await showAlert(
        '❌ ยกเลิกไม่สำเร็จ',
        error.response?.data?.error || 'เกิดข้อผิดพลาด',
        'error'
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('ไฟล์ขนาดใหญ่เกินไป (ไม่เกิน 5MB)');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setUploadError('กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG)');
        return;
      }
      
      setSlipImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!slipImage) {
      setUploadError('กรุณาเลือกรูปสลิปการโอนเงิน');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        await uploadService.uploadSlip(order.id, base64Image);
        setUploadSuccess(true);
        
        await showAlert(
          '✅ อัปโหลดสลิปสำเร็จ!',
          'รอการตรวจสอบจากแอดมิน',
          'success'
        );
        
        fetchOrder();
        setSlipImage(null);
        setPreview(null);
      };
      reader.readAsDataURL(slipImage);
    } catch (error) {
      setUploadError(error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
      await showAlert(
        '❌ อัปโหลดไม่สำเร็จ',
        error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setSlipImage(null);
    setPreview(null);
    setUploadError('');
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: '⏳ รอดำเนินการ', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
      processing: { label: '🔄 กำลังดำเนินการ', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
      shipped: { label: '📦 จัดส่งแล้ว', icon: Truck, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
      delivered: { label: '✅ จัดส่งสำเร็จ', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
      cancelled: { label: '❌ ยกเลิก', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
      returned: { label: '↩️ พัสดุตีกลับ', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPaymentLabel = (method) => {
    const methods = {
      promptpay: 'QR PromptPay (โอนแล้วอัปโหลดสลิป)',
      credit: 'บัตรเครดิต / เดบิต',
      cod: 'ชำระเงินปลายทาง (COD)',
      bank_transfer: 'โอนเงินผ่านธนาคาร'
    };
    return methods[method] || method;
  };

  const isCustomer = user?.id === order?.userId;
  const isAdmin = user?.role === 'administrator';
  const isCOD = order?.paymentMethod === 'cod';
  const canCancel = isCustomer && order?.status === 'pending';
  
  const canUpload = isCustomer && !order?.slipImage && order?.status === 'pending' && !isCOD;
  const canConfirm = isAdmin && order?.slipImage && !order?.paymentConfirmed;

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
        <div className="container text-center py-20">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">ไม่พบคำสั่งซื้อ</p>
          <Link to="/orders" className="btn-primary mt-4 inline-block">กลับ</Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const totalWithShipping = (order.totalAmount || 0) + 50;

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <Link to="/orders" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft size={20} /> กลับ
          </Link>
          
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition"
            >
              <Trash2 size={18} />
              ยกเลิกคำสั่งซื้อ
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-black">📋 รายละเอียดคำสั่งซื้อ</h1>
          <span className="text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-lg">
            #ORD-{order.id}
          </span>
        </div>

        <div className={`glass-card flex items-center gap-4 mb-6 ${statusInfo.bg}`}>
          <statusInfo.icon size={32} className={statusInfo.color} />
          <div>
            <p className="text-sm text-gray-400">สถานะ</p>
            <p className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
          </div>
          <span className="ml-auto text-sm text-gray-400">{order.orderDate}</span>
        </div>

        {(order.trackingCourier || order.trackingNumber) && (
          <div className="glass-card bg-blue-500/10 border-blue-500/20 mb-6 p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-400">
              <Truck size={20} />
              ข้อมูลการจัดส่ง
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-sports-navy/50 p-4 rounded-lg border border-white/5">
                <p className="text-sm text-gray-400 mb-1">บริษัทขนส่ง</p>
                <p className="font-bold text-white text-lg">{order.trackingCourier || '-'}</p>
              </div>
              <div className="bg-sports-navy/50 p-4 rounded-lg border border-white/5">
                <p className="text-sm text-gray-400 mb-1">หมายเลขพัสดุ</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold text-sports-red text-lg tracking-wider">{order.trackingNumber || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(isCustomer || isAdmin) && (
          <div className={`glass-card p-6 mb-6 ${
            isCOD 
              ? 'bg-green-500/5 border-green-500/20' 
              : 'bg-gradient-to-r from-sports-red/5 to-orange-500/5 border-sports-red/20'
          }`}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Banknote size={20} className={isCOD ? 'text-green-400' : 'text-sports-red'} /> 
              การชำระเงิน
            </h3>

            {isCOD ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-green-400" />
                  <div>
                    <p className="font-semibold text-green-400">✅ ชำระเงินปลายทาง (COD)</p>
                    <p className="text-sm text-gray-400">คุณจะชำระเงินเมื่อได้รับสินค้า</p>
                    {order.status === 'delivered' && (
                      <p className="text-sm text-green-400 mt-1">🎉 ชำระเงินเรียบร้อยแล้ว</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {(order.paymentMethod === 'bank_transfer' || order.paymentMethod === 'promptpay') && (
                  <div className="bg-sports-navy/50 p-4 rounded-lg mb-4 border border-white/5">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sports-red/20 flex items-center justify-center flex-shrink-0">
                          <Banknote size={20} className="text-sports-red" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">โอนเงินเข้าบัญชี</p>
                          <p className="font-bold">{bankSettings.bankName || 'ธนาคารกสิกรไทย'}</p>
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <p className="text-lg font-mono text-sports-red font-bold tracking-wider">
                          {bankSettings.bankAccountNumber || '012-3-45678-9'}
                        </p>
                        <p className="text-sm text-gray-400">ชื่อบัญชี: {bankSettings.bankAccountName || 'ร้าน SPORTSGEAR'}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                        <QrCode size={24} className="text-sports-red" />
                        <span className="text-xs text-gray-400">สแกน QR</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <CreditCard size={16} />
                  <span>ช่องทาง: {getPaymentLabel(order.paymentMethod)}</span>
                </div>

                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <>
                    {order.slipImage ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle2 size={18} /> อัปโหลดสลิปแล้ว
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                          <img 
                            src={order.slipImage} 
                            alt="สลิปการโอน" 
                            className="max-h-48 rounded-lg mx-auto border border-white/10"
                          />
                        </div>
                        {order.paymentConfirmed ? (
                          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            <CheckCircle2 size={18} /> ยืนยันการชำระเงินแล้ว
                            {order.confirmedAt && (
                              <span className="text-sm text-gray-400 ml-auto">
                                {new Date(order.confirmedAt).toLocaleString('th-TH')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                            <Clock size={18} /> รอการตรวจสอบจากแอดมิน
                          </div>
                        )}
                      </div>
                    ) : (
                      canUpload && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-400">📌 กรุณาอัปโหลดสลิปการโอนเงินเพื่อยืนยันการชำระ</p>
                          
                          {preview ? (
                            <div className="relative bg-white/5 p-3 rounded-lg">
                              <img 
                                src={preview} 
                                alt="สลิปการโอน" 
                                className="w-full max-h-48 object-contain rounded-lg"
                              />
                              <button
                                onClick={removeImage}
                                className="absolute top-4 right-4 p-1.5 bg-black/70 rounded-full hover:bg-red-500 transition"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-sports-red hover:bg-sports-red/5 transition">
                              <div className="flex flex-col items-center justify-center">
                                <Upload size={28} className="text-gray-500 mb-2" />
                                <p className="text-sm text-gray-400">คลิกเพื่อเลือกรูปสลิป</p>
                                <p className="text-xs text-gray-500">PNG, JPG (ไม่เกิน 5MB)</p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                          )}

                          {uploadError && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                              <AlertCircle size={18} /> {uploadError}
                            </div>
                          )}

                          {uploadSuccess && (
                            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                              <CheckCircle2 size={18} /> อัปโหลดสลิปสำเร็จ! รอการตรวจสอบจากแอดมิน
                            </div>
                          )}

                          <button
                            onClick={handleUpload}
                            disabled={!slipImage || uploading}
                            className="w-full py-3 bg-sports-red rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {uploading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                กำลังอัปโหลด...
                              </>
                            ) : (
                              <>📤 อัปโหลดสลิป</>
                            )}
                          </button>
                        </div>
                      )
                    )}
                  </>
                )}
              </>
            )}

            {!isCOD && canConfirm && (
              <button
                onClick={async () => {
                  const result = await showConfirm(
                    'ยืนยันการโอนเงิน',
                    'ยืนยันว่าลูกค้าโอนเงินเรียบร้อยแล้ว?',
                    'ยืนยัน',
                    'ยกเลิก'
                  );
                  if (!result.isConfirmed) return;
                  
                  try {
                    await uploadService.confirmPayment(order.id);
                    await showAlert('✅ ยืนยันการโอนเงินสำเร็จ', 'สถานะคำสั่งซื้อถูกอัปเดตเรียบร้อย', 'success');
                    fetchOrder();
                  } catch (error) {
                    await showAlert('❌ เกิดข้อผิดพลาด', error.response?.data?.error || 'ไม่สามารถยืนยันการโอนได้', 'error');
                  }
                }}
                className="w-full mt-4 py-3 bg-green-600 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> ยืนยันการโอนเงิน
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Package size={18} className="text-sports-red" /> รายการสินค้า
            </h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-sports-navy to-sports-dark/50 flex items-center justify-center text-2xl flex-shrink-0">
                    {['👟', '⚽', '🏀', '🎾', '🏃', '💪'][(item.productId || item.id) % 6] || '👟'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.product?.name || `สินค้า #${item.productId}`}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span>จำนวน x{item.quantity}</span>
                      {item.color && <span>• สี: {item.color}</span>}
                      {item.size && <span>• ไซส์: {item.size}</span>}
                    </div>
                  </div>
                  <span className="font-bold text-sports-red text-sm whitespace-nowrap">
                    ฿ {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-sports-red" /> สรุปคำสั่งซื้อ
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-400">
                <span>ยอดรวมสินค้า</span>
                <span>฿ {order.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>ค่าจัดส่ง</span>
                <span>฿ 50</span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>ยอดสุทธิ</span>
                  <span className="text-sports-red">฿ {totalWithShipping.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">ที่อยู่จัดส่ง:</span>
                <span className="text-gray-300">{order.shippingAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">ชำระเงิน:</span>
                <span className="text-gray-300">{getPaymentLabel(order.paymentMethod)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}