import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import Swal from 'sweetalert2';
import { Save, Banknote, QrCode, CreditCard, Building, ArrowLeft } from 'lucide-react';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    promptPayQR: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAll();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching settings:', error);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลการตั้งค่าได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await settingsService.update(settings);
      Swal.fire('สำเร็จ', 'อัปเดตการตั้งค่าระบบเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error updating settings:', error);
      Swal.fire('ข้อผิดพลาด', error?.response?.data?.error || 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors group"
            title="ย้อนกลับ"
          >
            <ArrowLeft className="text-gray-400 group-hover:text-white transition-colors" size={28} />
          </button>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Banknote className="text-sports-red" size={32} />
            ตั้งค่าการชำระเงิน
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
              <Building className="text-sports-red" size={20} />
              ข้อมูลบัญชีธนาคาร
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">ชื่อธนาคาร</label>
                <input
                  type="text"
                  name="bankName"
                  value={settings.bankName || ''}
                  onChange={handleChange}
                  className="w-full bg-sports-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sports-red transition"
                  placeholder="เช่น ธนาคารกสิกรไทย"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">ชื่อบัญชี</label>
                <input
                  type="text"
                  name="bankAccountName"
                  value={settings.bankAccountName || ''}
                  onChange={handleChange}
                  className="w-full bg-sports-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sports-red transition"
                  placeholder="เช่น บริษัท สปอร์ตเกียร์ จำกัด"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">เลขบัญชี</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    name="bankAccountNumber"
                    value={settings.bankAccountNumber || ''}
                    onChange={handleChange}
                    className="w-full bg-sports-dark border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-sports-red transition"
                    placeholder="เช่น 012-3-45678-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
              <QrCode className="text-sports-red" size={20} />
              พร้อมเพย์ QR Code
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">URL รูปภาพ QR Code</label>
                <input
                  type="text"
                  name="promptPayQR"
                  value={settings.promptPayQR || ''}
                  onChange={handleChange}
                  className="w-full bg-sports-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sports-red transition"
                  placeholder="https://example.com/my-qr-code.jpg"
                />
              </div>

              {settings.promptPayQR && (
                <div className="mt-4 p-4 border border-gray-800 rounded-lg bg-black/20 flex flex-col items-center">
                  <span className="text-sm text-gray-400 mb-3">ภาพตัวอย่างที่ลูกค้าจะเห็น (ซูมเฉพาะ QR Code):</span>
                  <div className="bg-white p-1 rounded-lg overflow-hidden w-[150px] h-[150px] flex items-center justify-center border border-gray-200">
                    <img
                      src={settings.promptPayQR}
                      alt="PromptPay QR Preview"
                      className="w-full h-full object-cover scale-[1.65] origin-[center_38%]"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.nextSibling.style.display = 'block';
                      }}
                    />
                  </div>
                  <div className="hidden text-red-400 text-sm mt-2">
                    ❌ ไม่สามารถโหลดรูปภาพจาก URL นี้ได้
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={20} />
              )}
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}