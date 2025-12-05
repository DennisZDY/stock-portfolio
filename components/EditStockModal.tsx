import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Holding, RiskLevel, StrategyType } from '../types';

interface EditStockModalProps {
  holding: Holding;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedHolding: Holding) => void;
}

export const EditStockModal: React.FC<EditStockModalProps> = ({ holding, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Holding>(holding);

  useEffect(() => {
    setFormData(holding);
  }, [holding]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">編輯持股: {holding.symbol} {holding.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">進入策略</label>
              <select 
                  value={formData.strategy}
                  onChange={(e) => setFormData({...formData, strategy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.values(StrategyType).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">風度</label>
              <select 
                  value={formData.riskLevel}
                  onChange={(e) => setFormData({...formData, riskLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Object.values(RiskLevel).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">買入日期</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">股數 (Shares)</label>
              <input
                type="number"
                value={formData.shares}
                onChange={(e) => setFormData({...formData, shares: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">平均成本</label>
              <input
                type="number"
                value={formData.averageCost}
                onChange={(e) => setFormData({...formData, averageCost: Number(e.target.value)})}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">個股資金上限</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">$</span>
              <input
                  type="number"
                  value={formData.capitalLimit || ''}
                  onChange={(e) => setFormData({...formData, capitalLimit: e.target.value ? Number(e.target.value) : undefined})}
                  placeholder="未設定"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              儲存變更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};