import { Holding, RiskLevel, StrategyType, SoldTransaction } from './types';

// --- 預設設定 (您可以在這裡修改預設值) ---
export const DEFAULT_CONFIG = {
  initialCapital: 5000000, // 預設本金
  discount: 1.7            // 預設手續費折數
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// 預設持股：改為空陣列，讓您開啟時是乾淨的
export const MOCK_HOLDINGS: Holding[] = [];

// 預設歷史紀錄：改為空陣列
export const MOCK_SOLD_HISTORY: SoldTransaction[] = [];

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
