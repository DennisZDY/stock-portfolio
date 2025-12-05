import { Holding, RiskLevel, StrategyType, SoldTransaction } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const MOCK_HOLDINGS: Holding[] = [
  {
    id: generateId(),
    symbol: "8271",
    name: "宇瞻",
    shares: 2000,
    averageCost: 95.00,
    currentPrice: 100.00,
    purchaseDate: "2024-11-24",
    strategy: StrategyType.BossPullback,
    riskLevel: RiskLevel.StrongWind,
    capitalLimit: 200000
  },
  {
    id: generateId(),
    symbol: "2449",
    name: "京元電子",
    shares: 1000,
    averageCost: 226.00,
    currentPrice: 226.50,
    purchaseDate: "2024-12-02",
    strategy: StrategyType.PartTimeStrongDay,
    riskLevel: RiskLevel.StrongWind,
    capitalLimit: 300000
  },
  {
    id: generateId(),
    symbol: "8996",
    name: "高力",
    shares: 600,
    averageCost: 495.00,
    currentPrice: 532.00,
    purchaseDate: "2024-11-19",
    strategy: StrategyType.BossPullback,
    riskLevel: RiskLevel.StrongWind,
    capitalLimit: 300000
  }
];

export const MOCK_SOLD_HISTORY: SoldTransaction[] = [
    {
        id: "sold-1",
        symbol: "2603",
        name: "長榮",
        shares: 1000,
        averageCost: 180.00,
        sellPrice: 166.24,
        sellDate: "2024-11-10",
        purchaseDate: "2024-05-10",
        profitLoss: -13760,
        strategy: StrategyType.OfficeWorkerStrongWeek,
        riskLevel: RiskLevel.Turbulence
    }
];

export const STOCK_NAME_MAP: Record<string, string> = {
  "2330": "台積電",
  "2317": "鴻海",
  "2454": "聯發科",
  "2308": "台達電",
  "2603": "長榮",
  "8271": "宇瞻",
  "2449": "京元電子",
  "8996": "高力",
  "AAPL": "Apple Inc.",
  "NVDA": "NVIDIA",
  "TSLA": "Tesla"
};