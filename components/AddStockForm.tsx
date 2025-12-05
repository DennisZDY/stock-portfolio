import React, { useState } from 'react';
import { Plus, Loader2, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import { Holding, RiskLevel, StrategyType } from '../types';
import { STOCK_NAME_MAP } from '../constants';

interface AddStockFormProps {
  onAdd: (holding: Omit<Holding, 'id' | 'currentPrice'>) => void;
}

export const AddStockForm: React.FC<AddStockFormProps> = ({ onAdd }) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<StrategyType>(StrategyType.PartTimeStrongDay);
  const [risk, setRisk] = useState<RiskLevel>(RiskLevel.StrongWind);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shares, setShares] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mobile/Tablet collapse state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // New state for live name preview
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

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
        // Continue to next source
      }
    }

    // 2. Try Secondary Source (TWSE MIS via CORS Proxy)
    try {
        // Query both TSE and OTC simultaneously
        const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${cleanSymbol}.tw|otc_${cleanSymbol}.tw&json=1&delay=0`;
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
        const data = await res.json();
        
        if (data && data.msgArray && data.msgArray.length > 0) {
            // Find valid result with a name
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !shares || !cost) return;

    setIsSubmitting(true);

    onAdd({
      symbol: symbol.toUpperCase().trim(),
      name: name.trim() || "未知個股",
      shares: Number(shares),
      averageCost: Number(cost),
      purchaseDate: date,
      strategy: strategy,
      riskLevel: risk
    });

    setIsSubmitting(false);

    // Reset fields
    setSymbol('');
    setName('');
    setShares('');
    setCost('');
    setFetchMessage('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit sticky top-6">
      <div 
        className="flex items-center justify-between cursor-pointer md:cursor-auto select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
            <div className={`p-1 bg-blue-100 rounded text-blue-600 transition-colors ${isExpanded ? 'bg-blue-600 text-white' : ''} md:bg-blue-100 md:text-blue-600`}>
                <Plus size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">新增持股</h2>
        </div>
        
        {/* Toggle Icon: Visible only on < md (Mobile) */}
        <div className="md:hidden text-gray-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className={`space-y-3 ${isExpanded ? 'block mt-6' : 'hidden'} md:block md:mt-4`}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">股票代號</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onBlur={handleSymbolBlur}
            placeholder="例如: 2330, AAPL"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">股票名稱</label>
          <div className="relative">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="輸入代號後自動查詢"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-8"
                required
            />
            <div className="absolute right-3 top-2 text-gray-400">
                {isLoadingName ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
            </div>
          </div>
          {fetchMessage && (
            <div className={`text-xs mt-1 ${fetchMessage.includes('查無') ? 'text-orange-500' : 'text-gray-500'}`}>
                {fetchMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">進入策略</label>
            <select 
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as StrategyType)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.values(StrategyType).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">風度圖</label>
            <select 
                value={risk}
                onChange={(e) => setRisk(e.target.value as RiskLevel)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">股數</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">平均成本</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
        </div>

        <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {isSubmitting ? '處理中' : '加入投資組合'}
        </button>
      </form>
    </div>
  );
};