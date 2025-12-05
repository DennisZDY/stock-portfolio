import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Download, RotateCcw, RefreshCw, BarChart3, Database } from 'lucide-react';
import { Holding, PortfolioStats, SoldTransaction } from './types';
import { MOCK_HOLDINGS, MOCK_SOLD_HISTORY } from './constants';
import { StatCard } from './components/StatCard';
import { AddStockForm } from './components/AddStockForm';
import { HoldingItem } from './components/HoldingItem';
import { EditStockModal } from './components/EditStockModal';
import { SellStockModal } from './components/SellStockModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SoldHistoryModal } from './components/SoldHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { MergeStockModal } from './components/MergeStockModal';

// Keys for LocalStorage
const STORAGE_KEYS = {
  CAPITAL: 'stock_app_capital',
  HOLDINGS: 'stock_app_holdings',
  SOLD_HISTORY: 'stock_app_sold_history',
  REALIZED_PL: 'stock_app_realized_pl',
  DISCOUNT: 'stock_app_discount'
};

const App: React.FC = () => {
  // --- State Initialization with LocalStorage ---
  
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CAPITAL);
    return saved ? Number(saved) : 1000000;
  });

  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
    return saved ? JSON.parse(saved) : MOCK_HOLDINGS;
  });

  const [soldHistory, setSoldHistory] = useState<SoldTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOLD_HISTORY);
    return saved ? JSON.parse(saved) : MOCK_SOLD_HISTORY;
  });

  const [realizedPL, setRealizedPL] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REALIZED_PL);
    // If no saved PL, calculate from history if available, else 0
    if (saved) return Number(saved);
    const historySaved = localStorage.getItem(STORAGE_KEYS.SOLD_HISTORY);
    const history = historySaved ? JSON.parse(historySaved) : MOCK_SOLD_HISTORY;
    return history.reduce((sum: number, item: SoldTransaction) => sum + item.profitLoss, 0);
  });

  const [discount, setDiscount] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DISCOUNT);
    return saved ? Number(saved) : 2.8;
  });

  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error'>('success');
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  
  // Modal State
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [sellingHolding, setSellingHolding] = useState<Holding | null>(null);
  const [mergingHolding, setMergingHolding] = useState<Holding | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState<string | null>(null);
  const [showSoldHistory, setShowSoldHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence Effects ---
  // Save to LocalStorage whenever critical data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPITAL, initialCapital.toString());
  }, [initialCapital]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOLD_HISTORY, JSON.stringify(soldHistory));
  }, [soldHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REALIZED_PL, realizedPL.toString());
  }, [realizedPL]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISCOUNT, discount.toString());
  }, [discount]);


  // Derived Statistics
  const stats: PortfolioStats = useMemo(() => {
    let investedCapital = 0;
    let marketValue = 0;
    
    // Fee rate for stats calculation (0.1425% * discount)
    const feeRate = 0.001425 * (discount / 10);

    holdings.forEach(h => {
      const rawCost = h.shares * h.averageCost;
      // Include buy fee in invested capital
      const buyFee = Math.round(rawCost * feeRate);
      investedCapital += (rawCost + buyFee);
      marketValue += h.shares * h.currentPrice;
    });

    const unrealizedPL = marketValue - investedCapital;
    const unrealizedPLPercent = investedCapital > 0 ? (unrealizedPL / investedCapital) * 100 : 0;
    
    // Cash = Initial - Invested + Realized P/L
    const cashBalance = initialCapital - investedCapital + realizedPL;
    
    // Total Assets = Cash + Market Value
    const totalAssets = cashBalance + marketValue;

    return {
      initialCapital,
      totalAssets,
      cashBalance,
      marketValue,
      unrealizedPL,
      unrealizedPLPercent,
      realizedPL,
      holdingCount: holdings.length
    };
  }, [initialCapital, holdings, realizedPL, discount]);

  // Count frequencies of symbols to determine if merge is possible
  const symbolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    holdings.forEach(h => {
      counts[h.symbol] = (counts[h.symbol] || 0) + 1;
    });
    return counts;
  }, [holdings]);

  // Handlers
  const handleAddHolding = (newHoldingData: Omit<Holding, 'id' | 'currentPrice'>) => {
    // Mock current price as cost +/- 2% initially, will be updated by sync
    const currentPrice = newHoldingData.averageCost;

    const newHolding: Holding = {
      ...newHoldingData,
      id: Math.random().toString(36).substr(2, 9),
      currentPrice
    };

    setHoldings(prev => [newHolding, ...prev]);
  };

  const handleDeleteHolding = (id: string) => {
    setHoldingToDelete(id);
  };

  const confirmDelete = () => {
    if (holdingToDelete) {
      setHoldings(prev => prev.filter(h => h.id !== holdingToDelete));
      setHoldingToDelete(null);
    }
  };

  const handleEditHolding = (holding: Holding) => {
    setEditingHolding(holding);
  };

  const handleUpdateHolding = (updatedHolding: Holding) => {
    setHoldings(prev => prev.map(h => h.id === updatedHolding.id ? updatedHolding : h));
    setEditingHolding(null);
  };

  const handleSellRequest = (holding: Holding) => {
    setSellingHolding(holding);
  };

  const handleMergeRequest = (holding: Holding) => {
    setMergingHolding(holding);
  };

  const handleConfirmMerge = (targetId: string, sourceIds: string[]) => {
    if (sourceIds.length === 0) return;

    setHoldings(prev => {
        const target = prev.find(h => h.id === targetId);
        if (!target) return prev;

        const sources = prev.filter(h => sourceIds.includes(h.id));
        
        // 1. Calculate Weighted Average Cost
        let totalShares = target.shares;
        let totalCost = target.shares * target.averageCost;

        // 2. Aggregate all original purchase dates
        const dateSet = new Set<string>();
        
        // Add target dates
        if (target.originalPurchaseDates && target.originalPurchaseDates.length > 0) {
            target.originalPurchaseDates.forEach(d => dateSet.add(d));
        } else {
            dateSet.add(target.purchaseDate);
        }

        sources.forEach(source => {
            totalShares += source.shares;
            totalCost += source.shares * source.averageCost;
            
            // Add source dates
            if (source.originalPurchaseDates && source.originalPurchaseDates.length > 0) {
                source.originalPurchaseDates.forEach(d => dateSet.add(d));
            } else {
                dateSet.add(source.purchaseDate);
            }
        });

        const newAverageCost = totalShares > 0 ? totalCost / totalShares : 0;
        
        // Sort dates
        const sortedDates = Array.from(dateSet).sort();

        const updatedTarget = {
            ...target,
            shares: totalShares,
            averageCost: newAverageCost,
            originalPurchaseDates: sortedDates,
            // Keep other properties from target (purchaseDate, Strategy etc.)
        };

        // Return new array: Updated target + filter out sources
        return prev
            .map(h => h.id === targetId ? updatedTarget : h)
            .filter(h => !sourceIds.includes(h.id));
    });
  };

  const handleConfirmSell = (holdingId: string, sellPrice: number, sellShares: number, sellDate: string, sellRiskLevel?: string, sellReason?: string) => {
    const holding = holdings.find(h => h.id === holdingId);
    if (!holding) return;

    // Calculate Fees and Net P/L
    const feeRate = 0.001425 * (discount / 10);
    const taxRate = 0.003;

    // 1. Calculate Buying Costs for the sold portion
    const rawBuyCost = holding.averageCost * sellShares;
    const buyFee = Math.round(rawBuyCost * feeRate);
    const totalBuyCost = rawBuyCost + buyFee;

    // 2. Calculate Selling Revenue and Costs
    const rawSellRevenue = sellPrice * sellShares;
    const sellFee = Math.round(rawSellRevenue * feeRate);
    const sellTax = Math.round(rawSellRevenue * taxRate);
    const netSellRevenue = rawSellRevenue - sellFee - sellTax;

    // 3. Net P/L
    const profitLoss = netSellRevenue - totalBuyCost;

    const transaction: SoldTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: holding.symbol,
      name: holding.name,
      shares: sellShares,
      sellPrice: sellPrice,
      averageCost: holding.averageCost,
      sellDate: sellDate,
      purchaseDate: holding.purchaseDate,
      originalPurchaseDates: holding.originalPurchaseDates, // Pass merged dates history
      profitLoss: profitLoss,
      strategy: holding.strategy,
      riskLevel: holding.riskLevel,
      sellStrategy: sellReason,
      sellRiskLevel: sellRiskLevel
    };

    // Update Realized P/L
    setRealizedPL(prev => prev + profitLoss);
    setSoldHistory(prev => [transaction, ...prev]);

    // Update Holding
    if (sellShares >= holding.shares) {
      // Sold all
      setHoldings(prev => prev.filter(h => h.id !== holdingId));
    } else {
      // Partial sell
      setHoldings(prev => prev.map(h => {
        if (h.id === holdingId) {
          return { ...h, shares: h.shares - sellShares };
        }
        return h;
      }));
    }

    setSellingHolding(null);
  };

  const handleAddSoldTransaction = (transaction: SoldTransaction) => {
    setSoldHistory(prev => [transaction, ...prev]);
    setRealizedPL(prev => prev + transaction.profitLoss);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    // Clear State
    setHoldings([]);
    setSoldHistory([]);
    setRealizedPL(0);
    setInitialCapital(1000000); // Reset to default capital
    
    // Clear LocalStorage
    localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
    localStorage.removeItem(STORAGE_KEYS.SOLD_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.REALIZED_PL);
    localStorage.removeItem(STORAGE_KEYS.CAPITAL);
    // Note: We might want to keep DISCOUNT setting, or reset it too. Here we keep it or reset manually if needed.
    
    setShowResetConfirm(false);
  };

  const fetchSingleUrl = async (symbol: string, market: 'tse' | 'otc') => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`https://stock-quote-proxy.sukailin1124.workers.dev/quote?symbol=${symbol}&market=${market}&t=${Date.now()}`);
      const data = await response.json();
      if (data && typeof data.price === 'number') {
        return { ...data, name: data.name }; // Include name in return
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const fetchStockPrice = async (symbol: string) => {
    try {
      // 1. Try TSE (上市) first
      let data = await fetchSingleUrl(symbol, 'tse');
      
      // 2. If no data, try OTC (上櫃)
      if (!data) {
        data = await fetchSingleUrl(symbol, 'otc');
      }

      // 3. Fallback: TWSE MIS API via CORS Proxy
      if (!data) {
         try {
            const targetUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${symbol}.tw|otc_${symbol}.tw&json=1&delay=0&t=${Date.now()}`;
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
            const misData = await res.json();
            
            if (misData && misData.msgArray && misData.msgArray.length > 0) {
                const info = misData.msgArray.find((item: any) => item.c === symbol);
                if (info) {
                    // z: price, y: yesterday price
                    const priceStr = info.z !== '-' ? info.z : info.y;
                    if (priceStr && priceStr !== '-') {
                        data = {
                            price: parseFloat(priceStr),
                            name: info.n,
                            // date will be set below
                        };
                    }
                }
            }
         } catch (e) {
             console.warn(`Fallback fetch failed for ${symbol}`);
         }
      }

      if (data && (data.price !== undefined)) {
        return {
          symbol,
          price: data.price,
          name: data.name,
          // Use current time as update time, format as locale string
          date: new Date().toLocaleTimeString('zh-TW', { hour12: true })
        };
      }
      return null;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  };

  const handleSyncTWSE = async (isAuto = false) => {
    if (holdings.length === 0) {
      if (!isAuto) alert("目前沒有持股可更新");
      return;
    }

    setIsSyncing(true);
    
    try {
      // Create an array of promises to fetch data concurrently
      const promises = holdings.map(h => fetchStockPrice(h.symbol));
      const results = await Promise.all(promises);
      
      let updatedCount = 0;
      
      setHoldings(prevHoldings => {
        return prevHoldings.map(holding => {
          const result = results.find(r => r && r.symbol === holding.symbol);
          if (result) {
            updatedCount++;
            // Update name if it was missing or '未知個股'
            const currentName = holding.name;
            const newName = (currentName === '未知個股' || !currentName) && result.name ? result.name : currentName;
            
            return {
              ...holding,
              currentPrice: result.price,
              lastUpdated: result.date,
              name: newName
            };
          }
          return holding;
        });
      });

      if (updatedCount > 0) {
        setLastSyncStatus('success');
        setLastUpdateTime(new Date().toLocaleTimeString('zh-TW', { hour12: true }));
        // Only show alert if manual trigger
        if (!isAuto) {
           setTimeout(() => alert(`更新完成！已同步 ${updatedCount} 檔股票的即時報價`), 100);
        }
      } else {
        setLastSyncStatus('error');
        if (!isAuto) alert("更新失敗，可能無法連線至報價主機或查無代號");
      }

    } catch (error) {
      console.error("Sync failed:", error);
      setLastSyncStatus('error');
      if (!isAuto) alert("連線發生錯誤，請檢查網路狀態");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto Refresh Effect (5 minutes)
  useEffect(() => {
    if (isAutoRefresh) {
      const intervalId = setInterval(() => {
        handleSyncTWSE(true);
      }, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(intervalId);
    }
  }, [isAutoRefresh, holdings]);

  const handleBackup = () => {
    const data = {
      timestamp: new Date().toISOString(),
      initialCapital,
      holdings,
      soldHistory,
      realizedPL,
      discount
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation
        if (data.holdings && Array.isArray(data.holdings)) {
           if (window.confirm(`確定要還原 ${data.timestamp ? new Date(data.timestamp).toLocaleString() : '此備份'} 的資料嗎？\n目前的資料將被覆蓋。`)) {
               setInitialCapital(data.initialCapital || 1000000);
               setHoldings(data.holdings);
               setSoldHistory(data.soldHistory || []);
               setRealizedPL(data.realizedPL || 0);
               if (data.discount) setDiscount(data.discount);
               // Reset update time
               setLastUpdateTime('');
           }
        } else {
            alert('無效的備份檔案格式');
        }
      } catch (error) {
        alert('讀取檔案失敗：請確認檔案格式是否正確');
        console.error(error);
      }
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hidden File Input for Restore */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileRestore}
        className="hidden"
        accept=".json"
      />

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <BarChart3 className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-gray-800 tracking-tight hidden md:inline">智慧庫存試算助手</span>
              <span className="font-bold text-lg text-gray-800 tracking-tight md:hidden">智慧庫存</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                title="設定"
              >
                <Settings size={16} />
                <span className="md:inline">設定</span>
              </button>
              <div className="h-6 w-px bg-gray-300 mx-1 md:mx-2"></div>
              <button 
                onClick={handleBackup}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <Download size={16} />
                <span className="hidden md:inline">備份</span>
              </button>
              <button 
                onClick={handleRestoreClick}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <RotateCcw size={16} />
                <span className="hidden md:inline">還原</span>
              </button>
               <button 
                 onClick={handleReset}
                 className="text-xs md:text-sm text-red-500 hover:text-red-700 font-medium ml-1 md:ml-2 px-2 md:px-3 py-1 md:py-1.5 hover:bg-red-50 rounded-lg transition-colors"
               >
                重置
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        
        {/* Consolidated Summary Grid - CHANGED TO 2 COLUMNS ON MOBILE */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          
          {/* Item 1: Initial Capital (Custom Input Card) */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-gray-500 text-xs font-medium mb-1">設定總投入本金</h3>
            <div className="relative mb-0.5">
               <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
               <input 
                  type="number" 
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  className="w-full pl-4 py-0 text-base md:text-lg font-bold text-gray-900 border-none outline-none focus:ring-0 p-0 h-auto placeholder-gray-300"
               />
            </div>
            <div className="text-xs text-gray-400 mt-1">
               已投入: ${(initialCapital - stats.cashBalance + realizedPL).toLocaleString()}
            </div>
          </div>

          {/* Item 2-6: Stat Cards */}
          <StatCard 
            title="目前資產總值" 
            value={`$${stats.totalAssets.toLocaleString()}`} 
            footer="股票市值 + 現金"
            highlight={true}
          />
          <StatCard 
            title="剩餘可用資金" 
            value={`$${stats.cashBalance.toLocaleString()}`} 
            footer={`其中可分配額度: $${Math.max(0, stats.cashBalance * 0.8).toLocaleString()}`} 
          />
          <StatCard 
            title="未實現損益" 
            value={`$${stats.unrealizedPL > 0 ? '+' : ''}${stats.unrealizedPL.toLocaleString()}`}
            subValue={`${stats.unrealizedPLPercent > 0 ? '+' : ''}${stats.unrealizedPLPercent.toFixed(2)}%`}
            subValueColor={stats.unrealizedPL >= 0 ? 'text-stock-up' : 'text-stock-down'}
          />
          <StatCard 
            title="已實現總損益" 
            value={`$${stats.realizedPL.toLocaleString()}`} 
            subValue="已結算交易"
            subValueColor={stats.realizedPL >= 0 ? 'text-stock-up' : 'text-stock-down'}
            onClick={() => setShowSoldHistory(true)}
          />
          <StatCard 
            title="持有股票市值" 
            value={`$${stats.marketValue.toLocaleString()}`} 
            footer={`持有 ${stats.holdingCount} 檔股票`} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <AddStockForm onAdd={handleAddHolding} />
          </div>

          {/* Right Content */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 rounded-xl p-1">
              {/* List Header - COMPACTED FOR MOBILE */}
              <div className="flex items-center justify-between px-3 py-3 md:p-4 mb-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">持股明細</h2>
                  <span 
                    className={`flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium transition-colors ${
                      lastSyncStatus === 'success' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}
                    title="測試API是否健康"
                  >
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${lastSyncStatus === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    Sheet Sync
                  </span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1 md:gap-2">
                    <div className={`w-8 h-4 md:w-10 md:h-5 rounded-full p-0.5 md:p-1 cursor-pointer transition-colors ${isAutoRefresh ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => setIsAutoRefresh(!isAutoRefresh)}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isAutoRefresh ? 'translate-x-4 md:translate-x-5' : ''}`}></div>
                    </div>
                    <span className="text-xs md:text-sm text-gray-600 hidden md:inline">自動 (5m)</span>
                  </div>
                  <button 
                    onClick={() => handleSyncTWSE(false)}
                    disabled={isSyncing}
                    className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
                  >
                     <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                     <span className="hidden md:inline">更新</span>
                  </button>
                </div>
              </div>

              {/* Table Header Labels - REORDERED */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <div className="col-span-2">代號/名稱</div>
                <div className="col-span-2">策略/時間</div>
                <div className="col-span-2">現價/漲跌</div>
                <div className="col-span-3">成本/損平</div>
                <div className="col-span-2">損益</div>
                <div className="col-span-1 text-center">操作</div>
              </div>

              {/* Holdings List */}
              <div className="space-y-1">
                {holdings.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <Database className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">目前沒有持股</p>
                    <p className="text-sm text-gray-400">從左側新增您的第一筆投資</p>
                  </div>
                ) : (
                  holdings.map(holding => (
                    <HoldingItem 
                      key={holding.id} 
                      holding={holding} 
                      discount={discount}
                      hasDuplicates={symbolCounts[holding.symbol] > 1}
                      onDelete={handleDeleteHolding}
                      onEdit={handleEditHolding}
                      onSell={handleSellRequest}
                      onMerge={handleMergeRequest}
                    />
                  ))
                )}
              </div>

              <div className="text-right text-[10px] md:text-xs text-gray-400 mt-4 px-4">
                最後更新: {lastUpdateTime || new Date().toLocaleTimeString()} (來源: Cloudflare Proxy)
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modals */}
      {editingHolding && (
        <EditStockModal 
          holding={editingHolding}
          isOpen={!!editingHolding}
          onClose={() => setEditingHolding(null)}
          onSave={handleUpdateHolding}
        />
      )}

      {sellingHolding && (
        <SellStockModal
          holding={sellingHolding}
          isOpen={!!sellingHolding}
          discount={discount}
          onClose={() => setSellingHolding(null)}
          onConfirm={handleConfirmSell}
        />
      )}

      {mergingHolding && (
        <MergeStockModal 
            targetHolding={mergingHolding}
            allHoldings={holdings}
            isOpen={!!mergingHolding}
            onClose={() => setMergingHolding(null)}
            onConfirm={handleConfirmMerge}
        />
      )}

      <SoldHistoryModal
        isOpen={showSoldHistory}
        onClose={() => setShowSoldHistory(false)}
        history={soldHistory}
        onAdd={handleAddSoldTransaction}
        discount={discount}
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title="確認重置"
        message="確認清空所有數據？此動作無法復原。"
        confirmText="確認重置"
        isDangerous={true}
      />
      
      <ConfirmModal
        isOpen={!!holdingToDelete}
        onClose={() => setHoldingToDelete(null)}
        onConfirm={confirmDelete}
        title="刪除持股"
        message="確定要刪除此持股嗎？"
        confirmText="刪除"
        isDangerous={true}
      />
      
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        discount={discount}
        onSave={setDiscount}
      />
    </div>
  );
};

export default App;
