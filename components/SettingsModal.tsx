import React, { useState, useEffect } from 'react';
import { X, Save, Percent, Calculator } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: number;
  onSave: (discount: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, discount, onSave }) => {
  const [localDiscount, setLocalDiscount] = useState<string>(discount.toString());

  useEffect(() => {
    setLocalDiscount(discount.toString());
  }, [discount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(localDiscount);
    if (!isNaN(val) && val > 0 && val <= 10) {
      onSave(val);
      onClose();
    } else {
      alert("請輸入有效的折數 (0.1 - 10)");
    }
  };

  const currentFeeRate = 0.1425 * (parseFloat(localDiscount) || 10) / 10;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Percent size={20} className="text-blue-600" />
            手續費折扣設定
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">電子下單手續費折扣 (折)</label>
            <div className="relative">
                <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={localDiscount}
                    onChange={(e) => setLocalDiscount(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
                    placeholder="例如: 2.8"
                />
                <span className="absolute right-3 top-2 text-gray-400 font-medium">折</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                說明：2.8 折請輸入 2.8，不打折請輸入 10。
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-700 font-bold mb-2 text-sm">
                <Calculator size={16} />
                損平價格試算說明
            </div>
            <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span>原始手續費率</span>
                    <span>0.1425%</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span>您的手續費率 ({localDiscount}折)</span>
                    <span className="font-bold text-blue-600">{currentFeeRate.toFixed(6)}%</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span>證交稅率 (賣出)</span>
                    <span>0.3%</span>
                </div>
                <div className="pt-1">
                    <div className="font-medium text-gray-700 mb-1">計算公式：</div>
                    <div className="bg-white p-2 rounded border border-gray-200 font-mono text-[10px] leading-relaxed">
                        損平價 = (總成本 ÷ 股數) ÷ <br/>
                        (1 - 證交稅率 - 手續費率)
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              儲存設定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};