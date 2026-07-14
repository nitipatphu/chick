import React, { useState } from 'react';
import { Banknote, QrCode, CheckCircle2, Copy, Check } from 'lucide-react';

export default function PaymentSelector({ onSelect, selectedMethod, totalAmount }) {
  const [copied, setCopied] = useState(false);

  const methods = [
    { 
      id: 'promptpay', 
      label: 'QR PromptPay', 
      icon: QrCode,
      description: 'สแกน QR จ่ายไว',
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    { 
      id: 'cod', 
      label: 'ชำระปลายทาง (COD)', 
      icon: Banknote,
      description: 'จ่ายเมื่อรับสินค้า',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    }
  ];

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm ${
              selectedMethod === method.id 
                ? `border-sports-red ${method.bg} text-white` 
                : 'border-white/10 hover:border-white/30 text-gray-400'
            }`}
          >
            <method.icon size={16} className={selectedMethod === method.id ? method.color : 'text-gray-500'} />
            <span className="font-medium">{method.label}</span>
            {selectedMethod === method.id && (
              <CheckCircle2 size={14} className="text-sports-red" />
            )}
          </button>
        ))}
      </div>

      
      <div className="min-h-[180px]">
   
        {selectedMethod === 'promptpay' && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg flex-shrink-0">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=012345678901234" 
                  alt="QR Code"
                  className="w-[100px] h-[100px]"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">ยอดที่ต้องชำระ</span>
                  <span className="text-xl font-bold text-sports-red">฿ {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">เลขบัญชี:</span>
                  <span className="text-xs font-mono font-bold text-white">012-345-6789-01234</span>
                  <button
                    onClick={() => handleCopy('012-345-6789-01234')}
                    className="p-1 hover:text-sports-red transition rounded"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">* โอนแล้วระบบอัปเดตภายใน 5 นาที</p>
              </div>
            </div>
          </div>
        )}


        {selectedMethod === 'cod' && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Banknote size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">ชำระเมื่อได้รับสินค้า</p>
                  <p className="text-xs text-gray-400">ยอดรวม <span className="text-purple-400 font-bold">฿ {totalAmount.toLocaleString()}</span></p>
                </div>
              </div>
              <span className="text-[10px] text-gray-500">✅ ไม่มีค่าธรรมเนียม</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}