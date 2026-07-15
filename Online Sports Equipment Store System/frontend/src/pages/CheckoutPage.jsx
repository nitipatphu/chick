// frontend/src/pages/CheckoutPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { addressService } from '../services/addressService';
import { settingsService } from '../services/settingsService';
import { uploadService } from '../services/uploadService';
import AddressSelector from '../components/AddressSelector';
import PaymentSelector from '../components/PaymentSelector';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, MapPin, CreditCard, ShieldCheck, ShoppingBag, 
  CheckCircle2, Banknote, QrCode, Upload, X, AlertCircle 
} from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, totalPrice, clearCart, loadCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [addresses, setAddresses] = useState([]);
  const [bankSettings, setBankSettings] = useState({
    bankName: 'ธนาคารกสิกรไทย',
    bankAccountName: 'ร้าน SPORTSGEAR',
    bankAccountNumber: '012-3-45678-9',
    promptPayQR: 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=012345678901234'
  });
  

  const [slipImage, setSlipImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


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
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getPublic();
        if (settings) {
          setBankSettings({
            bankName: settings.bankName || 'ธนาคารกสิกรไทย',
            bankAccountName: settings.bankAccountName || 'ร้าน SPORTSGEAR',
            bankAccountNumber: settings.bankAccountNumber || '012-3-45678-9',
            promptPayQR: settings.promptPayQR || 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=012345678901234'
          });
        }
      } catch (error) {
        console.error('Error loading bank settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, cartItems, navigate]);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getAll();
      setAddresses(data);
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  
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

  const handleUploadSlip = async () => {
    if (!slipImage) {
      setUploadError('กรุณาเลือกรูปสลิปการโอนเงิน');
      return;
    }
    if (!orderCreated) {
      setUploadError('กรุณาสร้างคำสั่งซื้อก่อน');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        await uploadService.uploadSlip(orderCreated.id, base64Image);
        setUploadSuccess(true);
        
        await showAlert(
          '✅ อัปโหลดสลิปสำเร็จ!',
          'รอการตรวจสอบจากแอดมิน (ใช้เวลาไม่เกิน 24 ชั่วโมง)',
          'success'
        );
        
        clearCart();
        await loadCart();
        navigate(`/order/${orderCreated.id}`);
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

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!selectedAddressId) {
      await showAlert(
        '⚠️ ยังไม่ได้เลือกที่อยู่',
        'กรุณาเลือกที่อยู่จัดส่งก่อนดำเนินการ',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);

    const freshItems = await loadCart();

    if (freshItems.length === 0) {
      setIsSubmitting(false);
      await showAlert(
        '⚠️ ตะกร้าสินค้าว่าง',
        'กรุณาเพิ่มสินค้าลงตะกร้าก่อนดำเนินการ',
        'warning'
      );
      return;
    }

    const result = await showConfirm(
      'ยืนยันการสั่งซื้อ',
      `คุณต้องการสั่งซื้อสินค้ารวมทั้งหมด ${cartItems.length} รายการ เป็นเงิน ${total.toLocaleString()} บาท ใช่หรือไม่?`,
      'ยืนยันการสั่งซื้อ',
      'ยกเลิก'
    );

    if (!result.isConfirmed) {
      setIsSubmitting(false);
      return;
    }

    setLoading(true);

    try {
      let selectedAddress = addresses.find(a => a.id === selectedAddressId);
      
      if (!selectedAddress) {
        selectedAddress = await addressService.getById(selectedAddressId);
      }
      
      if (!selectedAddress) {
        throw new Error('ไม่พบข้อมูลที่อยู่จัดส่ง กรุณาเลือกที่อยู่อีกครั้ง');
      }

      const shippingAddress = `${selectedAddress.address}${
        selectedAddress.district ? `, ${selectedAddress.district}` : ''
      }, ${selectedAddress.city}${
        selectedAddress.province ? `, ${selectedAddress.province}` : ''
      }${selectedAddress.postalCode ? ` ${selectedAddress.postalCode}` : ''}`;

      const orderData = {
        shippingAddress,
        paymentMethod,
        fullName: selectedAddress.fullName,
        phone: selectedAddress.phone,
        addressId: selectedAddress.id,
      };

      const result = await orderService.create(orderData);
      
      if (result.success) {
        if (paymentMethod === 'cod') {
          clearCart();
          await loadCart();
          setIsSubmitting(false);
          await showAlert(
            '✅ สั่งซื้อสำเร็จ!',
            `คำสั่งซื้อ #${result.orderId} ถูกบันทึกเรียบร้อย\nกรุณารอการจัดส่ง`,
            'success'
          );
          navigate(`/order/${result.orderId}`);
        } else {
          setOrderCreated(result.order);
          setIsSubmitting(false);
          await showAlert(
            '✅ สร้างคำสั่งซื้อสำเร็จ!',
            `คำสั่งซื้อ #${result.orderId} ถูกบันทึกเรียบร้อย\nกรุณาอัปโหลดสลิปการโอนเงิน`,
            'success'
          );
        }
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      await showAlert(
        '❌ เกิดข้อผิดพลาด',
        error.response?.data?.error || 'กรุณาลองใหม่อีกครั้ง',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUpload = async () => {
    const result = await showConfirm(
      'ยกเลิกการอัปโหลดสลิป',
      'คุณต้องการยกเลิกการอัปโหลดสลิปใช่หรือไม่?\n(คำสั่งซื้อจะยังคงอยู่ในระบบ และคุณสามารถอัปโหลดทีหลังได้)',
      'ยืนยัน',
      'ยกเลิก'
    );
    
    if (result.isConfirmed) {
      setOrderCreated(null);
      setSlipImage(null);
      setPreview(null);
      navigate('/orders');
    }
  };

  if (!isAuthenticated || cartItems.length === 0) return null;

  const shippingFee = 50;
  const total = totalPrice + shippingFee;


  if (paymentMethod === 'cod' && orderCreated) {
    navigate(`/order/${orderCreated.id}`);
    return null;
  }

  
  if (orderCreated && paymentMethod !== 'cod') {
    return (
      <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={handleCancelUpload}
              className="p-2 glass rounded-lg hover:text-sports-red transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black">📤 อัปโหลดสลิปการโอนเงิน</h1>
          </div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-400">
                คำสั่งซื้อ #ORD-{orderCreated.id} | ยอดเงิน: <span className="text-sports-red font-bold">฿ {total.toLocaleString()}</span>
              </p>
              <button
                onClick={handleCancelUpload}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                กลับไปหน้าคำสั่งซื้อ
              </button>
            </div>

     
            <div className="bg-sports-navy p-4 rounded-lg mb-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sports-red/20 flex items-center justify-center">
                    <Banknote size={20} className="text-sports-red" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">โอนเงินเข้าบัญชี</p>
                    <p className="font-bold">{bankSettings.bankName}</p>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-lg font-mono text-sports-red font-bold">{bankSettings.bankAccountNumber}</p>
                  <p className="text-sm text-gray-400">ชื่อบัญชี: {bankSettings.bankAccountName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode size={24} className="text-sports-red" />
                  <span className="text-xs text-gray-400">สแกน QR</span>
                </div>
              </div>
            </div>

          
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
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/15 rounded-xl cursor-pointer hover:border-sports-red hover:bg-sports-red/5 transition">
                  <div className="flex flex-col items-center justify-center">
                    <Upload size={32} className="text-gray-500 mb-2" />
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

              <div className="flex gap-3">
                <button
                  onClick={handleUploadSlip}
                  disabled={!slipImage || uploading}
                  className="flex-1 py-3 bg-sports-red rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <button
                  onClick={handleCancelUpload}
                  className="px-6 py-3 border border-white/20 rounded-lg font-semibold hover:bg-white/5 transition"
                >
                  ข้ามไปก่อน (อัปโหลดทีหลัง)
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                คุณสามารถอัปโหลดสลิปทีหลังได้ที่หน้า ประวัติการสั่งซื้อ
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                const result = await showConfirm(
                  'ออกจากหน้า Checkout',
                  'คุณต้องการกลับไปหน้าตะกร้าสินค้าใช่หรือไม่? (ข้อมูลที่กรอกจะไม่ถูกบันทึก)',
                  'ยืนยัน',
                  'ยกเลิก'
                );
                if (result.isConfirmed) {
                  navigate('/cart');
                }
              }} 
              className="p-2 glass rounded-lg hover:text-sports-red transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black">💳 ชำระเงิน</h1>
              <p className="text-sm text-gray-400">กรอกข้อมูลให้ครบถ้วนเพื่อดำเนินการสั่งซื้อ</p>
            </div>
          </div>
          <div className="text-sm text-gray-400 hidden md:block">
            <span className="text-sports-red font-bold">ขั้นตอนที่ 2</span> / 2
          </div>
        </div>

        {paymentMethod === 'cod' && (
          <div className="glass-card p-4 mb-6 bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-400" />
              <div>
                <p className="font-semibold text-green-400">ชำระเงินปลายทาง (COD)</p>
                <p className="text-sm text-gray-400">คุณไม่ต้องอัปโหลดสลิป ชำระเงินเมื่อได้รับสินค้า</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
   
          <div className="lg:col-span-3 space-y-5">

            <div className="glass-card">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                <MapPin size={18} className="text-sports-red" />
                <h2 className="font-bold">ที่อยู่จัดส่ง</h2>
                {selectedAddressId && (
                  <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> เลือกแล้ว
                  </span>
                )}
              </div>
              <AddressSelector 
                onSelect={setSelectedAddressId}
                selectedAddressId={selectedAddressId}
              />
            </div>

            <div className="glass-card">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                <CreditCard size={18} className="text-sports-red" />
                <h2 className="font-bold">ช่องทางชำระเงิน</h2>
                {paymentMethod && (
                  <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> เลือกแล้ว
                  </span>
                )}
              </div>
              <PaymentSelector
                onSelect={setPaymentMethod}
                selectedMethod={paymentMethod}
                totalAmount={total}
                bankSettings={bankSettings}
              />
            </div>

     
            <div className={`glass-card p-4 ${
              paymentMethod === 'cod' 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-yellow-500/5 border-yellow-500/20'
            }`}>
              <h4 className={`font-semibold flex items-center gap-2 mb-2 ${
                paymentMethod === 'cod' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                <span>📌</span> {paymentMethod === 'cod' ? 'วิธีชำระเงินปลายทาง' : 'วิธีการชำระเงิน'}
              </h4>
              {paymentMethod === 'cod' ? (
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>กด "ยืนยันการสั่งซื้อ" เพื่อสร้างคำสั่งซื้อ</li>
                  <li>รอการจัดส่งสินค้า</li>
                  <li>ชำระเงินเมื่อได้รับสินค้า</li>
                </ol>
              ) : (
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>กด "ยืนยันการสั่งซื้อ" เพื่อสร้างคำสั่งซื้อ</li>
                  <li>โอนเงินเข้าบัญชีตามที่กำหนด</li>
                  <li>บันทึกหรือถ่ายรูปสลิปการโอน</li>
                  <li>อัปโหลดสลิปในหน้าถัดไป</li>
                </ol>
              )}
            </div>

   
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedAddressId || isSubmitting}
              className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  กำลังดำเนินการ...
                </span>
              ) : (
                `ยืนยันการสั่งซื้อ (฿ ${total.toLocaleString()})`
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={14} className="text-green-400" />
              <span>รับประกันการชำระเงินปลอดภัย 100%</span>
            </div>
          </div>

       
          <div className="lg:col-span-2">
            <div className="glass-card sticky top-24">
              <h2 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <ShoppingBag size={16} className="text-sports-red" /> สรุปคำสั่งซื้อ
              </h2>
              
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">👟</span>
                    <span className="flex-1 truncate text-gray-300">{item.name || item.product?.name}</span>
                    <span className="text-gray-400">x{item.quantity}</span>
                    <span className="font-bold text-sports-red text-xs">
                      ฿ {((item.price || item.product?.price || 0) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <p className="text-xs text-gray-500">+ อีก {cartItems.length - 3} รายการ</p>
                )}
              </div>

              <div className="border-t border-white/10 mt-3 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">ยอดรวมสินค้า</span>
                  <span>฿ {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ค่าจัดส่ง</span>
                  <span>฿ {shippingFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-white/10 mt-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">ยอดสุทธิ</span>
                  <span className="text-xl font-bold text-sports-red">฿ {total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-3 p-2 glass rounded-lg text-center">
                <p className="text-[10px] text-gray-400">
                  {paymentMethod === 'promptpay' && '💳 ชำระผ่าน QR PromptPay (โอนแล้วอัปโหลดสลิป)'}
                  {paymentMethod === 'cod' && '📦 ชำระเงินเมื่อได้รับสินค้า'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}