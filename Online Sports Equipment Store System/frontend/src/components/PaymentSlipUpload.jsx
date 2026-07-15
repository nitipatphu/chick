import React, { useState } from 'react';
import { uploadService } from '../services/uploadService';
import { CheckCircle2, Upload, X, Image, AlertCircle } from 'lucide-react';

export default function PaymentSlipUpload({ orderId, onSuccess }) {
  const [slipImage, setSlipImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ไฟล์ขนาดใหญ่เกินไป (ไม่เกิน 5MB)');
        return;
      }
      // ตรวจสอบประเภทไฟล์
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setError('กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG)');
        return;
      }
      
      setSlipImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!slipImage) {
      setError('กรุณาเลือกรูปสลิปการโอนเงิน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // แปลงเป็น base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        await uploadService.uploadSlip(orderId, base64Image);
        setSuccess(true);
        onSuccess?.();
      };
      reader.readAsDataURL(slipImage);
    } catch (error) {
      setError(error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setSlipImage(null);
    setPreview(null);
    setError('');
  };

  if (success) {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
        <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
        <p className="font-semibold text-green-400">อัปโหลดสลิปสำเร็จ!</p>
        <p className="text-sm text-gray-400">รอการตรวจสอบจากแอดมิน</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <Image size={20} className="text-sports-red" />
          <h4 className="font-semibold">แนบสลิปการโอนเงิน</h4>
        </div>

        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="สลิปการโอน" 
              className="w-full max-h-64 object-contain rounded-lg border border-white/10"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-black/70 rounded-full hover:bg-red-500 transition"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-sports-red transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload size={24} className="text-gray-400 mb-2" />
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

        {error && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!slipImage || loading}
          className="w-full mt-3 py-2 bg-sports-red rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'กำลังอัปโหลด...' : '📤 อัปโหลดสลิป'}
        </button>
      </div>
    </div>
  );
}