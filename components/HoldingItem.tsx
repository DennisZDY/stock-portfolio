import React from 'react';
import { Edit2, DollarSign, Trash2, Info, Merge } from 'lucide-react';
import { Holding, RiskLevel } from '../types';

interface HoldingItemProps {
  holding: Holding;
  discount: number;
  hasDuplicates: boolean;
  onDelete: (id: string) => void;
  onEdit: (holding: Holding) => void;
  onSell: (holding: Holding) => void;
  onMerge: (holding: Holding) => void;
}

export const HoldingItem: React.FC<HoldingItemProps> = ({ holding, discount, hasDuplicates, onDelete, onEdit, onSell, onMerge }) => {
  // Fee rate: 0.1425% * discount rate (e.g., 0.6 for 6折, 0.28 for 2.8折)
  const feeRate = 0.001425 * (discount / 10);
  const taxRate = 0.003;
  
  // Calculate Costs
  const rawCost = holding.shares * holding.averageCost;
  const buyFee = Math.round(rawCost * feeRate);
  const totalCost = rawCost + buyFee; // Total cost includes buy fee
  
  // Calculate Market Value & PL (Gross)
  const marketValue = holding.shares * holding.currentPrice;
  const pl = marketValue - totalCost; // PL = Market Value - (Cost + Buy Fee)
  const plPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;
  
  // Taiwan market: Red is UP (Profit), Green is DOWN (Loss)
  const isProfit = pl >= 0;
  const colorClass = isProfit ? 'text-stock-up' : 'text-stock-down';
  const priceChange = holding.currentPrice - holding.averageCost;

  // Days held calculation
  const daysHeld = Math.ceil((new Date().getTime() - new Date(holding.purchaseDate).getTime()) / (1000 * 3600 * 24));

  // Break-even Price = Total Cost / Shares / (1 - SellFee - Tax)
  // This is more accurate as it considers the actual Total Cost (including rounded buy fee)
  // Formula: NetProceeds = Price * Shares * (1 - Rate) >= TotalCost
  // So: Price >= TotalCost / Shares / (1 - Rate)
  const breakEvenPrice = (totalCost / holding.shares) / (1 - feeRate - taxRate);

  // Calculate estimated costs at break-even point for the tooltip
  const breakEvenRevenue = breakEvenPrice * holding.shares;
  const estSellFeeBE = Math.round(breakEvenRevenue * feeRate);
  const estTaxBE = Math.round(breakEvenRevenue * taxRate);
  const totalFrictionCostsBE = buyFee + estSellFeeBE + estTaxBE;

  // Calculate estimated costs at CURRENT market price for P/L tooltip and Net P/L display
  const currentSellFee = Math.round(marketValue * feeRate);
  const currentTax = Math.round(marketValue * taxRate);
  const totalFrictionCostsCurrent = buyFee + currentSellFee + currentTax;
  
  // Net P/L if sold now = Market Value - Sell Costs - Buy Costs
  const netPL = marketValue - currentSellFee - currentTax - totalCost;
  const netPLPercent = totalCost > 0 ? (netPL / totalCost) * 100 : 0;
  const isNetProfit = netPL >= 0;
  const netColorClass = isNetProfit ? 'text-stock-up' : 'text-stock-down';


  // Get color for RiskLevel
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case RiskLevel.StrongWind: return 'text-red-500'; // 強風=紅色
      case RiskLevel.Gust: return 'text-pink-500'; // 陣風=粉紅色
      case RiskLevel.Turbulence: return 'text-teal-500'; // 亂流=淺綠色/藍綠色
      case RiskLevel.Calm: return 'text-emerald-700'; // 無風=深綠色
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow relative z-0">
      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 items-center">
        
        {/* Column 1: Symbol & Name */}
        <div className="col-span-1 md:col-span-2 order-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-800">{holding.symbol}</span>
          </div>
          <div className="text-sm text-gray-500">{holding.name}</div>
        </div>

        {/* Column 2: Strategy -> On mobile, move to Top Right (Order 2) */}
        <div className="col-span-1 md:col-span-2 order-2 md:text-left text-right">
          <div className={`text-sm font-bold ${holding.strategy.includes('強勢') ? 'text-stock-up' : 'text-green-700'}`}>
            {holding.strategy}
          </div>
          <div className={`text-xs mt-1 font-medium ${getRiskLevelColor(holding.riskLevel)}`}>{holding.riskLevel}</div>
          <div className="text-xs text-gray-400 mt-1 hidden md:block">{holding.purchaseDate}</div>
          <div className="text-xs text-gray-500">持股 {daysHeld} 天</div>
        </div>

        {/* Column 3: Current Price -> On mobile, move to Row 2 Left (Order 3) */}
        <div className="col-span-1 md:col-span-2 order-3">
          <div className="flex items-center gap-1">
            <span className={`text-lg font-bold ${colorClass}`}>${holding.currentPrice.toFixed(2)}</span>
          </div>
          <div className={`text-xs ${colorClass}`}>
             {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)} ({plPercent > 0 ? '+' : ''}{plPercent.toFixed(2)}%)
          </div>
          <div className="text-xs text-gray-400 mt-1">報價: {holding.lastUpdated || '尚未更新'}</div>
        </div>

        {/* Column 5: P/L -> On mobile, move next to Price (Order 4) to allow comparison */}
        <div className="col-span-1 md:col-span-2 order-4 md:order-5">
          <div className="relative group cursor-help w-fit">
            
            {/* Top: Gross P/L */}
            <div className="mb-1">
                <div className={`text-base font-bold leading-none ${colorClass}`}>
                {pl.toLocaleString()}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${colorClass}`}>
                {plPercent.toFixed(2)}%
                </div>
            </div>

            {/* Bottom: Net P/L */}
            <div className="border-t border-gray-200 pt-1">
                <div className={`text-base font-bold leading-none ${netColorClass}`}>
                    <span className="text-[10px] text-gray-400 mr-1 font-normal">淨</span>
                    {Math.round(netPL).toLocaleString()}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${netColorClass}`}>
                    {netPLPercent.toFixed(2)}%
                </div>
            </div>

            {/* P/L Tooltip */}
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left pointer-events-none">
                <div className="font-bold text-gray-200 mb-2 pb-1 border-b border-gray-600">
                   交易成本明細 (以現價試算)
                </div>
                <div className="space-y-1.5 text-gray-300">
                  <div className="flex justify-between">
                    <span>買入手續費:</span>
                    <span>${buyFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>賣出手續費 (預估):</span>
                    <span>${currentSellFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>證交稅 (預估):</span>
                    <span>${currentTax}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-1 mt-1 flex justify-between font-bold text-yellow-400">
                    <span>摩擦成本總計:</span>
                    <span>${totalFrictionCostsCurrent.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-1 mt-1 flex justify-between font-bold text-white">
                    <span>預估淨損益:</span>
                    <span className={netPL >= 0 ? 'text-red-400' : 'text-green-400'}>${Math.round(netPL).toLocaleString()}</span>
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>

        {/* Column 4: Cost & Break-even -> On mobile, move below Price/PL (Order 5) and span full width */}
        <div className="col-span-2 md:col-span-3 order-5 md:order-4">
             <div className="text-xs text-gray-500 mb-1">{holding.shares} 股 @ {holding.averageCost.toFixed(2)}</div>
             <div className="flex flex-col">
                <span className="text-xs text-gray-500">
                  持有成本: <span className="font-medium text-gray-700">${Math.round(totalCost).toLocaleString()}</span>
                </span>
                
                <div className="relative group flex items-center gap-1 cursor-help w-fit mt-0.5">
                    <span className="text-xs text-gray-500">損平:</span>
                    <span className="font-medium text-purple-600 text-xs">${breakEvenPrice.toFixed(2)}</span>
                    <Info size={11} className="text-gray-400 hover:text-blue-500 transition-colors" />
                    
                    {/* Custom Tooltip showing specific cost amounts */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left pointer-events-none">
                        <div className="font-bold text-gray-200 mb-2 pb-1 border-b border-gray-600">
                           交易成本明細 (損平預估)
                        </div>
                        <div className="space-y-1.5 text-gray-300">
                          <div className="flex justify-between">
                            <span>買入手續費:</span>
                            <span>${buyFee}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>賣出手續費:</span>
                            <span>${estSellFeeBE}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>證交稅 (0.3%):</span>
                            <span>${estTaxBE}</span>
                          </div>
                          <div className="border-t border-gray-600 pt-1 mt-1 flex justify-between font-bold text-yellow-400">
                            <span>摩擦成本總計:</span>
                            <span>${totalFrictionCostsBE.toLocaleString()}</span>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
             </div>
        </div>

        {/* Column 6: Actions -> On mobile, order 6, full width, horizontal buttons */}
        <div className="col-span-2 md:col-span-1 order-6 flex justify-center">
            <div className="flex flex-row md:flex-col border border-gray-200 rounded-lg overflow-hidden divide-x md:divide-x-0 divide-y-0 md:divide-y divide-gray-200 shadow-sm w-full md:w-auto">
                <button 
                  onClick={() => onEdit(holding)}
                  className="flex-1 md:flex-none p-2 md:p-1.5 bg-white text-gray-400 hover:text-blue-600 hover:bg-gray-50 transition-colors flex justify-center items-center"
                  title="編輯"
                >
                    <Edit2 size={16} />
                </button>
                {hasDuplicates && (
                    <button 
                      onClick={() => onMerge(holding)}
                      className="flex-1 md:flex-none p-2 md:p-1.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-colors flex justify-center items-center"
                      title="合併相同個股"
                    >
                        <Merge size={16} />
                    </button>
                )}
                <button 
                  onClick={() => onSell(holding)}
                  className="flex-1 md:flex-none p-2 md:p-1.5 bg-white text-gray-400 hover:text-green-600 hover:bg-gray-50 transition-colors flex justify-center items-center"
                  title="賣出"
                >
                    <DollarSign size={16} />
                </button>
                <button 
                    onClick={() => onDelete(holding.id)}
                    className="flex-1 md:flex-none p-2 md:p-1.5 bg-white text-gray-400 hover:text-red-600 hover:bg-gray-50 transition-colors flex justify-center items-center"
                    title="刪除"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
