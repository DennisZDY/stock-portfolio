import React, { useState, useMemo } from 'react';
import { X, Merge, ArrowRight } from 'lucide-react';
import { Holding } from '../types';

interface MergeStockModalProps {
  targetHolding: Holding;
  allHoldings: Holding[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetId: string, sourceIds: string[]) => void;
}

export const MergeStockModal: React.FC<MergeStockModalProps> = ({ 
  targetHolding, 
  allHoldings, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  // Find other holdings with the same symbol
  const otherHoldings = useMemo(() => {
    return allHoldings.filter(h => h.symbol === targetHolding.symbol && h.id !== targetHolding.id);
  }, [allHoldings, targetHolding]);

  // State to track which holdings are selected for merging (default all)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(otherHoldings.map(h => h.id)));

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Calculation Logic
  const calculation = useMemo(() => {
    const holdingsToMerge = [
      targetHolding,
      ...otherHoldings.filter(h => selectedIds.has(h.id))
    ];

    let totalShares = 0;
    let totalCost = 0;

    holdingsToMerge.forEach(h => {
      totalShares += h.shares;
      totalCost += h.shares * h.averageCost;
    });

    const newAverageCost = totalShares > 0 ? totalCost / totalShares : 0;

    return {
      totalShares,
      newAverageCost,
      count: holdingsToMerge.length
    };
  }, [targetHolding, otherHoldings, selectedIds]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(targetHolding.id, Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-full">
                <Merge size={20} className="text-indigo-600" />
             </div>
             <div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 leading-tight">
                  合併持股
                </h3>
                <div className="text-xs text-gray-500 font-medium">
                    {targetHolding.symbol} {targetHolding.name}
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="text-sm text-gray-600 mb-5 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
            <div className="shrink-0 text-blue-500 mt-0.5">ℹ️</div>
            <div>
                請勾選要合併的紀錄，系統將自動計算<span className="font-bold text-gray-800">加權平均成本</span>。
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {/* Target Item (Locked) */}
            <div className="relative overflow-hidden rounded-xl border-2 border-indigo-100 bg-indigo-50/40">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                <div className="p-3 pl-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">保留設定 (主項目)</span>
                        <span className="text-xs text-gray-500 font-mono">{targetHolding.purchaseDate}</span>
                    </div>
                    <div className="flex justify-between items-end">
                         <div>
                             <div className="text-xs text-gray-500 mb-0.5">持有股數</div>
                             <div className="text-lg font-bold text-gray-800 leading-none">{targetHolding.shares.toLocaleString()}</div>
                         </div>
                         <div className="text-right">
                             <div className="text-xs text-gray-500 mb-0.5">平均成本</div>
                             <div className="text-lg font-bold text-gray-800 leading-none">${targetHolding.averageCost.toFixed(2)}</div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            {otherHoldings.length > 0 && (
                 <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative bg-white px-3 text-xs font-medium text-gray-400">
                        選擇合併來源
                    </div>
                 </div>
            )}

            {/* Other Items */}
            <div className="space-y-2">
                {otherHoldings.map(h => {
                const isSelected = selectedIds.has(h.id);
                return (
                    <div 
                        key={h.id} 
                        className={`relative rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                            isSelected 
                            ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleToggle(h.id)}
                    >
                        <div className="p-3 flex items-center gap-3">
                            <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                            }`}>
                                {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500 font-medium">來源紀錄</span>
                                    <span className="text-xs text-gray-400 font-mono">{h.purchaseDate}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="font-semibold text-gray-700">
                                        {h.shares.toLocaleString()} <span className="text-xs font-normal text-gray-500">股</span>
                                    </div>
                                    <div className="font-semibold text-gray-700">
                                        <span className="text-xs font-normal text-gray-500">$</span> {h.averageCost.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
                })}
            </div>
            
            {otherHoldings.length === 0 && (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm">沒有其他相同代號的庫存</p>
                </div>
            )}
          </div>

          {/* Preview Calculation Box */}
          <div className="bg-gray-900 text-white rounded-xl p-4 shadow-lg border border-gray-800">
             <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                   合併預覽
                </h4>
                <span className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-900">
                    共 {calculation.count} 筆
                </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {/* Total Shares */}
                <div className="bg-gray-800/60 rounded-lg p-3 relative overflow-hidden">
                    <div className="text-xs text-gray-400 mb-1">合併後總股數</div>
                    <div className="text-xl font-bold text-white tracking-tight leading-none">
                        {calculation.totalShares.toLocaleString()}
                    </div>
                    {/* Diff */}
                     <div className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 opacity-80">
                        原始: {targetHolding.shares.toLocaleString()}
                        <ArrowRight size={10} className="text-gray-600" />
                     </div>
                </div>

                {/* Avg Cost */}
                <div className="bg-gray-800/60 rounded-lg p-3 relative overflow-hidden">
                    <div className="text-xs text-gray-400 mb-1">加權平均成本</div>
                    <div className="text-xl font-bold text-yellow-400 tracking-tight leading-none">
                        ${calculation.newAverageCost.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 opacity-80">
                        原始: ${targetHolding.averageCost.toFixed(2)}
                        <ArrowRight size={10} className="text-gray-600" />
                     </div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white pb-6 md:pb-4">
            <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={selectedIds.size === 0}
                  className={`flex-[2] px-4 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md active:scale-[0.98] ${
                      selectedIds.size === 0 ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <Merge size={18} />
                  確認合併
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};