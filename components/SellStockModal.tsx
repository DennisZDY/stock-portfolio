import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Holding, RiskLevel } from '../types';

interface SellStockModalProps {
  holding: Holding;
  isOpen: boolean;
  discount: number;
  onClose: () => void;
  onConfirm: (holdingId: string, sellPrice: number, sellShares: number, sellDate: string, sellRiskLevel?: string, sellReason?: string) => void;
}

export const SellStockModal: React.FC<SellStockModalProps> = ({ holding, isOpen, discount, onClose, onConfirm }) => {
  const [price, setPrice] = useState<string>('');
  const [shares, setShares] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    if (isOpen && holding) {
      setPrice(holding.currentPrice.toString());
      setShares(holding.shares.toString());
      setRiskLevel(''); // Reset risk level
      setReason('');
    }
  }, [isOpen, holding]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(holding.id, Number(price), Number(shares), date, riskLevel || undefined, reason || undefined);
    onClose();
  };

  // Fee Calculation Logic
  const feeRate = 0.001425 * (discount / 10);
  const taxRate = 0.003;

  // 1. Buy Cost
  const rawBuyCost = holding.averageCost * Number(shares);
  const buyFee = Math.round(rawBuyCost * feeRate);
  const totalBuyCost = rawBuyCost + buyFee;
  const avgCostWithFee = totalBuyCost / (Number(shares) || 1);

  // 2. Sell Revenue
  const rawRevenue = Number(price) * Number(shares);
  const sellFee = Math.round(rawRevenue * feeRate);
  const sellTax = Math.round(rawRevenue * taxRate);
  const netRevenue = rawRevenue - sellFee - sellTax;

  // 3. Profit/Loss
  const estimatedPL = netRevenue - totalBuyCost;
  const plPercent = totalBuyCost > 0 ? (estimatedPL / totalBuyCost) * 100 : 0;
  const isProfit = estimatedPL >= 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">賣出持股: {holding.symbol} {holding.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
             <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>持有股數</span>
                <span className="font-bold">{holding.shares} 股</span>
             </div>
             <div className="flex justify-between text-sm text-gray-600" title="包含買進手續費的平均成本">
                <span>平均成本 (含手續費)</span>
                <span className="font-bold">${avgCostWithFee.toFixed(2)}</span>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">賣出日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">賣出價格</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">賣出股數</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                max={holding.shares}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">賣出風度 (選填)</label>
                <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                <option value="">-- 請選擇 --</option>
                {Object.values(RiskLevel).map(r => (
                    <option key={r} value={r}>{r}</option>
                ))}
                </select>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">備註/理由</label>
                 <input 
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="例如: 獲利了結"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 />
            </div>
          </div>

          {Number(shares) > 0 && Number(price) > 0 && (
            <div className={`p-3 rounded-lg border ${isProfit ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">預估淨損益 (扣除稅費)</span>
                    <div className="text-right">
                        <div className={`text-lg font-bold ${isProfit ? 'text-stock-up' : 'text-stock-down'}`}>
                            {estimatedPL >= 0 ? '+' : ''}{Math.round(estimatedPL).toLocaleString()}
                        </div>
                        <div className={`text-xs ${isProfit ? 'text-stock-up' : 'text-stock-down'}`}>
                            {plPercent.toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>
          )}

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
              <DollarSign size={18} />
              確認賣出
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};