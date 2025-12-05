
export interface Holding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  purchaseDate: string;
  originalPurchaseDates?: string[]; // For merged holdings
  strategy: string;
  riskLevel: string; // '強風' | '微風' | '無風' etc.
  capitalLimit?: number; // Optional limit for this specific stock
  lastUpdated?: string;
}

export interface PortfolioStats {
  initialCapital: number;
  totalAssets: number;
  cashBalance: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  realizedPL: number; // Mocked for this demo
  holdingCount: number;
}

export interface SoldTransaction {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  sellPrice: number;
  averageCost: number;
  sellDate: string;
  purchaseDate: string;
  originalPurchaseDates?: string[]; // For merged holdings
  profitLoss: number;
  strategy: string;
  riskLevel: string;
  sellStrategy?: string;
  sellRiskLevel?: string;
}

export enum RiskLevel {
  StrongWind = "強風",
  Turbulence = "亂流",
  Gust = "陣風",
  Calm = "無風"
}

export enum StrategyType {
  PartTimeStrongDay = "打工強勢日",
  OfficeWorkerStrongWeek = "上班族強勢週",
  BossPullback = "老闆週拉回",
  BossCheap = "老闆廉價收購",
  CarryVolumeK = "凱瑞量增K",
  CarrySoaringPullback = "凱瑞飆股拉回"
}