import React, { useState } from 'react';
import { X, History, Plus, ArrowLeft, Save, Loader2, PenLine, TrendingUp, TrendingDown, Calendar, DollarSign, Layers } from 'lucide-react';
import { SoldTransaction, StrategyType, RiskLevel } from '../types';
import { STOCK_NAME_MAP } from '../constants';

interface SoldHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SoldTransaction[];
  onAdd: (transaction: SoldTransaction) => void;
  discount: number;
}

export const SoldHistoryModal: React.FC<SoldHistoryModalProps> = ({ isOpen, onClose, history, onAdd, discount }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyStrategy, setBuyStrategy] = useState<StrategyType>(StrategyType.PartTimeStrongDay);
  const [buyRisk, setBuyRisk] = useState<RiskLevel>(RiskLevel.StrongWind);
  const [sellStrategy, setSellStrategy] = useState<string>('');
  const [sellRisk, setSellRisk] = useState<string>('');

  // Name fetching state
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  if (!isOpen) return null;

  const totalRealized = history.reduce((sum, item) => sum + item.profitLoss, 0);

  const fetchStockName = async (inputSymbol: string) => {
    const cleanSymbol = inputSymbol.trim().toUpperCase();
    
    // 1. Try Primary Source (Custom Worker)
    const markets = ['tse', 'otc'];
    for (const market of markets) {
      try {
        const res = await fetch(`https://stock-quote-proxy.sukailin1124.workers.dev/quote?symbol=${cleanSymbol}&market=${market}&t=${Date.now()}`);
        const data = await res.json();
        if (data && data.name) {
          return data.name;
        }
      } catch (e) {
        // Continue
      }
    }

    // 2. Try Secondary Source (TWSE MIS via CORS Proxy)
    try {
        const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${cleanSymbol}.tw|otc_${cleanSymbol}.tw&json=1&delay=0`;
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
        const data = await res.json();
        
        if (data && data.msgArray && data.msgArray.length > 0) {
            const valid = data.msgArray.find((item: any) => item.n && item.n !== 'null');
            if (valid) return valid.n;
        }
    } catch (e) {
        console.warn("Backup source failed:", e);
    }

    return null;
  };

  const handleSymbolBlur = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) {
        setFetchMessage('');
        return;
    }
    
    // Check local map first
    const mapName = STOCK_NAME_MAP[cleanSymbol];
    if (mapName) {
        setName(mapName);
        setFetchMessage('');
        return;
    }

    // Fetch from API
    setIsLoadingName(true);
    setFetchMessage('查詢中...');
    
    const fetched = await fetchStockName(cleanSymbol);
    if (fetched) {
        setName(fetched);
        setFetchMessage('');
    } else {
        setFetchMessage('查無名稱，請手動輸入');
        if (!name) setName('未知個股');
    }
    setIsLoadingName(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = Number(buyPrice);
    const price = Number(sellPrice);
    const count = Number(shares);

    // Calculate Net P/L (deducting fees and tax)
    const feeRate = 0.001425 * (discount / 10);
    const taxRate = 0.003;

    // Buy Cost with Fee
    const rawBuyCost = cost * count;
    const buyFee = Math.round(rawBuyCost * feeRate);
    const totalBuyCost = rawBuyCost + buyFee;

    // Sell Revenue with Fee and Tax
    const rawSellRevenue = price * count;
    const sellFee = Math.round(rawSellRevenue * feeRate);
    const sellTax = Math.round(rawSellRevenue * taxRate);
    const netSellRevenue = rawSellRevenue - sellFee - sellTax;
    
    // Net Profit/Loss
    const profitLoss = netSellRevenue - totalBuyCost;

    const newTransaction: SoldTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: symbol.toUpperCase().trim(),
      name: name.trim() || '自訂個股',
      shares: count,
      averageCost: cost,
      sellPrice: price,
      purchaseDate: buyDate,
      sellDate: sellDate,
      profitLoss,
      strategy: buyStrategy,
      riskLevel: buyRisk,
      sellStrategy: sellStrategy || undefined,
      sellRiskLevel: sellRisk || undefined
    };

    onAdd(newTransaction);
    setIsAdding(false);
    
    // Reset form
    setSymbol('');
    setName('');
    setShares('');
    setBuyPrice('');
    setSellPrice('');
    setBuyDate('');
    setSellStrategy('');
    setSellRisk('');
    setFetchMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
                <History size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  {isAdding ? '手動新增交易紀錄' : '已實現損益明細'}
                </h3>
            </div>
            <div className="flex items-center gap-2">
              {!isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span className="hidden md:inline">手動新增</span>
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X size={20} />
              </button>
            </div>
        </div>

        {!isAdding && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <span className="text-sm text-gray-600">此列表總損益</span>
              <span className={`text-xl font-bold ${totalRealized >= 0 ? 'text-stock-up' : 'text-stock-down'}`}>
                  {totalRealized >= 0 ? '+' : ''}{totalRealized.toLocaleString()}
              </span>
          </div>
        )}

        <div className="overflow-auto flex-1 p-4 bg-gray-50 md:bg-white">
            {isAdding ? (
              <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-4 py-4 bg-white md:bg-transparent p-4 rounded-xl md:p-0 shadow-sm md:shadow-none">
                 {/* ... (Previous Form Code Unchanged) ... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">股票代號</label>
                      <input 
                        required
                        type="text" 
                        value={symbol}
                        onChange={e => setSymbol(e.target.value)}
                        onBlur={handleSymbolBlur}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="例如: 2330"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">股票名稱</label>
                      <div className="relative">
                          <input 
                            required
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                            placeholder="輸入代號自動查詢"
                          />
                          <div className="absolute right-3 top-2.5 text-gray-400">
                             {isLoadingName ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
                          </div>
                      </div>
                      {fetchMessage && (
                        <div className={`text-xs mt-1 ${fetchMessage.includes('查無') ? 'text-orange-500' : 'text-gray-500'}`}>
                            {fetchMessage}
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">交易股數</label>
                      <input 
                        required
                        type="number" 
                        value={shares}
                        onChange={e => setShares(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="1000"
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">買入價格 (成本)</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={buyPrice}
                        onChange={e => setBuyPrice(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">賣出價格</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={sellPrice}
                        onChange={e => setSellPrice(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">買入日期</label>
                      <input 
                        required
                        type="date" 
                        value={buyDate}
                        onChange={e => setBuyDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">賣出日期</label>
                      <input 
                        required
                        type="date" 
                        value={sellDate}
                        onChange={e => setSellDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                 </div>

                 <div className="border-t border-gray-100 pt-4 mt-4">
                   <h4 className="text-sm font-bold text-gray-800 mb-3">買進策略與風度</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">買進策略</label>
                        <select 
                          value={buyStrategy}
                          onChange={e => setBuyStrategy(e.target.value as StrategyType)}
                          className="w-full px-3 py-2 border rounded-lg outline-none"
                        >
                          {Object.values(StrategyType).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">買進風度</label>
                        <select 
                          value={buyRisk}
                          onChange={e => setBuyRisk(e.target.value as RiskLevel)}
                          className="w-full px-3 py-2 border rounded-lg outline-none"
                        >
                          {Object.values(RiskLevel).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                   </div>
                 </div>

                 <div className="border-t border-gray-100 pt-4 mt-4">
                   <h4 className="text-sm font-bold text-gray-800 mb-3">賣出策略與風度 (選填)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">賣出策略/理由</label>
                        <input 
                          type="text"
                          value={sellStrategy}
                          onChange={e => setSellStrategy(e.target.value)}
                          placeholder="例如: 獲利了結"
                          className="w-full px-3 py-2 border rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">賣出風度</label>
                        <select 
                          value={sellRisk}
                          onChange={e => setSellRisk(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg outline-none"
                        >
                          <option value="">-- 未選擇 --</option>
                          {Object.values(RiskLevel).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                   </div>
                 </div>

                 <div className="flex gap-3 pt-6">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={18} />
                      返回列表
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      儲存紀錄
                    </button>
                 </div>
              </form>
            ) : (
                history.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        尚無賣出紀錄
                    </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {history.map((item, index) => {
                            const isProfit = item.profitLoss >= 0;
                            const roi = (item.profitLoss / (item.averageCost * item.shares)) * 100;
                            const daysHeld = item.purchaseDate 
                                ? Math.ceil((new Date(item.sellDate).getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 3600 * 24))
                                : 0;
                            const isMerged = item.originalPurchaseDates && item.originalPurchaseDates.length > 0;
                            
                            return (
                                <div key={item.id || index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-100">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg text-gray-800">{item.symbol}</span>
                                                <span className="text-sm text-gray-600">{item.name}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                              <div className="flex items-center gap-1 relative group">
                                                  <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 w-8 text-center">買進</span>
                                                  {item.purchaseDate}
                                                  {isMerged && (
                                                      <div className="relative z-10">
                                                          <Layers size={14} className="text-indigo-400 cursor-pointer" />
                                                          <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-32 bg-gray-800 text-white p-2 rounded text-[10px] shadow-lg">
                                                              <div className="font-bold mb-1 text-indigo-200 border-b border-gray-600 pb-1">合併歷史日期</div>
                                                              {item.originalPurchaseDates?.map(d => (
                                                                  <div key={d}>{d}</div>
                                                              ))}
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                              <div className="flex items-center gap-1">
                                                  <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 w-8 text-center">賣出</span>
                                                  {item.sellDate}
                                              </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${isProfit ? 'text-stock-up' : 'text-stock-down'}`}>
                                                {item.profitLoss > 0 ? '+' : ''}{Math.round(item.profitLoss).toLocaleString()}
                                            </div>
                                            <div className={`text-xs font-bold ${isProfit ? 'text-stock-up' : 'text-stock-down'}`}>
                                                {roi.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
                                        <div className="bg-gray-50 rounded p-1.5">
                                            <div className="text-gray-400 mb-0.5">股數</div>
                                            <div className="font-medium text-gray-700">{item.shares}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded p-1.5">
                                            <div className="text-gray-400 mb-0.5">買進</div>
                                            <div className="font-medium text-gray-700">{item.averageCost.toFixed(1)}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded p-1.5">
                                            <div className="text-gray-400 mb-0.5">賣出</div>
                                            <div className="font-medium text-gray-700">{item.sellPrice.toFixed(1)}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs mt-2">
                                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                            <span className="font-bold">買</span>
                                            {item.strategy}
                                            <span className="opacity-75 border-l border-blue-200 pl-1 ml-1">{item.riskLevel}</span>
                                        </div>
                                        {(item.sellStrategy || item.sellRiskLevel) && (
                                            <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                <span className="font-bold">賣</span>
                                                {item.sellStrategy || '-'}
                                                {item.sellRiskLevel && <span className="opacity-75 border-l border-purple-200 pl-1 ml-1">{item.sellRiskLevel}</span>}
                                            </div>
                                        )}
                                        <div className="ml-auto text-gray-400 flex items-center">
                                            持有 {daysHeld} 天
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 border-b border-gray-100">
                                <th className="py-2 font-medium pl-2">買進/賣出日期</th>
                                <th className="py-2 font-medium">代號/名稱</th>
                                <th className="py-2 font-medium">策略/風度/天數</th>
                                <th className="py-2 font-medium text-right">股數</th>
                                <th className="py-2 font-medium text-right">買進價</th>
                                <th className="py-2 font-medium text-right">賣出價</th>
                                <th className="py-2 font-medium text-right">損益金額</th>
                                <th className="py-2 font-medium text-right pr-2">報酬率</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item, index) => {
                                const isProfit = item.profitLoss >= 0;
                                const roi = (item.profitLoss / (item.averageCost * item.shares)) * 100;
                                const daysHeld = item.purchaseDate 
                                  ? Math.ceil((new Date(item.sellDate).getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 3600 * 24))
                                  : 0;
                                const isMerged = item.originalPurchaseDates && item.originalPurchaseDates.length > 0;
                                
                                return (
                                    <tr key={item.id || index} className="border-b border-gray-50 hover:bg-gray-50 text-sm">
                                        <td className="py-3 text-gray-600 align-top pl-2 whitespace-nowrap">
                                            <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1 relative group">
                                                <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-400 mr-1">買</span>
                                                {item.purchaseDate}
                                                {isMerged && (
                                                    <div className="relative inline-block ml-1">
                                                        <Layers size={14} className="text-indigo-400 cursor-help" />
                                                        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-full top-0 ml-2 w-36 bg-gray-800 text-white p-2 rounded text-xs shadow-xl z-50">
                                                            <div className="font-bold mb-1.5 text-indigo-300 border-b border-gray-600 pb-1">合併歷史日期</div>
                                                            <div className="max-h-32 overflow-y-auto space-y-0.5 text-gray-300">
                                                                {item.originalPurchaseDates?.map((d, i) => (
                                                                    <div key={i}>{d}</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-800"><span className="text-[10px] bg-gray-100 px-1 rounded text-gray-400 mr-1">賣</span>{item.sellDate}</div>
                                        </td>
                                        <td className="py-3 align-top">
                                            <div className="font-bold text-gray-800">{item.symbol}</div>
                                            <div className="text-xs text-gray-500">{item.name}</div>
                                        </td>
                                        <td className="py-3 align-top min-w-[200px]">
                                            <div className="flex flex-col gap-1.5">
                                                {/* Buy Info */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">買進</span>
                                                    <span className="text-xs font-bold text-blue-600">{item.strategy}</span>
                                                    <span className="text-xs text-gray-500">({item.riskLevel})</span>
                                                </div>
                                                {/* Sell Info */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">賣出</span>
                                                    <span className="text-xs font-bold text-purple-600">{item.sellStrategy || '-'}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {item.sellRiskLevel ? `(${item.sellRiskLevel})` : ''} • {daysHeld} 天
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right text-gray-600 align-top">{item.shares}</td>
                                        <td className="py-3 text-right text-gray-500 align-top">${item.averageCost.toFixed(2)}</td>
                                        <td className="py-3 text-right font-medium align-top">${item.sellPrice.toFixed(2)}</td>
                                        <td className={`py-3 text-right font-bold align-top ${isProfit ? 'text-stock-up' : 'text-stock-down'}`}>
                                            {item.profitLoss > 0 ? '+' : ''}{Math.round(item.profitLoss).toLocaleString()}
                                        </td>
                                        <td className={`py-3 text-right align-top pr-2 ${isProfit ? 'text-stock-up' : 'text-stock-down'}`}>
                                            {roi.toFixed(2)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                  </>
                )
            )}
        </div>
      </div>
    </div>
  );
};
