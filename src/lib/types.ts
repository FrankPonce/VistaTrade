export interface Stock {
    symbol: string;
    name: string;
    sector: string;
  }
  
  export interface PortfolioStock {
    symbol: string;
    shares: number;
    avgPrice: number;
    totalCost: number;
  }
  
  export interface Transaction {
    id: string;
    date: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
    total: number;
  }
  
  export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
  }
  
  export interface UserAccount {
    cash: number;
    initialInvestment: number;
    targetGoal: number;
    achievedGoals: string[];
    startDate: string;
  }
  
  export interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    tradeStock: string;
    setTradeStock: (stock: string) => void;
    tradeType: 'BUY' | 'SELL';
    setTradeType: (type: 'BUY' | 'SELL') => void;
    tradeShares: number;
    setTradeShares: (shares: number) => void;
    currentPrice: number;
    onConfirmTrade: () => void;
  }
  