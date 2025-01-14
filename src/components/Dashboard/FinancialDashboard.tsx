"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TutorialModal } from '@/components/Dashboard/TutorialModal';
import { DEFAULT_INITIAL_INVESTMENT, WINNING_GOAL } from '@/lib/constants';
import { UserAccount } from '@/lib/types';
import { Switch } from '../ui/switch';
import backgroundTexture from './bgg.png';
import safeStorage from '@/utils/safeStorage';


//import { fetchStockData, fetchIntradayData, connectWebSocket, disconnectWebSocket } from '@/app/api/stock-proxy/route';
// In your components, update the import path
import { 
  fetchStockData, 
  fetchIntradayData, 
  connectWebSocket, 
  disconnectWebSocket 
} from '@/lib/stockApi';

// Types
interface Stock {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  volume: number;
}

interface PortfolioStock {
  symbol: string;
  shares: number;
  avgPrice: number;
  totalCost: number;
}

interface Transaction {
  id: string;
  date: Date;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  total: number;
}
interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
}


// Constants
const AVAILABLE_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 151.70, volume: 996276 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', basePrice: 138.21, volume: 854123 },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', basePrice: 328.66, volume: 723456 },
  { symbol: 'AMZN', name: 'Amazon.com', sector: 'Consumer Cyclical', basePrice: 145.24, volume: 678901 },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Automotive', basePrice: 237.49, volume: 789012 },
];
const FinancialDashboard = () => {
  
  // State Management
  const [userAccount, setUserAccount] = useState(() => {
    const stored = safeStorage.getItem('userAccount');
    return stored ? JSON.parse(stored) : {
      cash: DEFAULT_INITIAL_INVESTMENT,
      initialInvestment: DEFAULT_INITIAL_INVESTMENT,
      targetGoal: WINNING_GOAL,
      startDate: new Date()
    };
  });

  const [portfolio, setPortfolio] = useState<PortfolioStock[]>(() => {
    const stored = safeStorage.getItem('portfolio');
    return stored ? JSON.parse(stored) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = safeStorage.getItem('transactions');
    return stored ? JSON.parse(stored) : [];
  });

  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !safeStorage.getItem('tutorialComplete'));

  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [tradeShares, setTradeShares] = useState(1);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  //const [chartData, setChartData] = useState<any[]>([]);
  // Modified chart data management
const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
const [useRealTimeAPI, setUseRealTimeAPI] = useState(false);
const [useSimulatedCharts, setUseSimulatedCharts] = useState(true); // New state




// Helper Functions
const calculatePortfolioValue = (): number => {
  const stocksValue = portfolio.reduce((total, stock) => {
    const currentPrice = currentPrices[stock.symbol] || 0;
    return total + (stock.shares * currentPrice);
  }, 0);
  return stocksValue + userAccount.cash;
};

const calculateProfitLoss = (): number => {
  const currentValue = calculatePortfolioValue();
  const initialValue = userAccount.initialInvestment;
  return ((currentValue - initialValue) / initialValue) * 100;
};

// Type the prev parameter in useState updates
const updateUserAccount = (prev: typeof userAccount) => ({
  ...prev,
  // your updates here
});

  // Price Generation and Update Logic
  const generateRandomPrice = useCallback((basePrice: number) => {
    const maxChange = basePrice * 0.02; // 2% max change
    const change = (Math.random() - 0.5) * maxChange;
    return basePrice + change;
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);

  const simulateNewDataPoint = () => {
    setChartData(prevData => {
      // Use current API price if available, otherwise use last price
      const basePrice = currentPrices[selectedStock] || prevData[prevData.length - 1].price;
      const volatility = 0.002;
      const change = basePrice * volatility * (Math.random() - 0.5);
      const newPrice = basePrice + change;
  
      const baseVolume = AVAILABLE_STOCKS.find(s => s.symbol === selectedStock)?.volume || 500000;
      const newVolume = baseVolume * (0.7 + Math.random() * 0.6);
  
      const newData = [...prevData.slice(1)];
      newData.push({
        time: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: newPrice,
        volume: newVolume
      });
      return newData;
    });
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
  
    const initializeData = async () => {
      setIsLoading(true);
      
      if (useRealTimeAPI && !useSimulatedCharts) {
        try {
          const data = await fetchIntradayData(selectedStock);
          if (data) {
            console.log('Using API chart data');
            setChartData(data);
          } else {
            console.log('Falling back to simulated chart data');
            setChartData(generateChartData());
            setUseSimulatedCharts(true); // Force simulation for charts
          }
        } catch (error) {
          console.error('Error fetching initial data:', error);
          setChartData(generateChartData());
          setUseSimulatedCharts(true); // Force simulation for charts
        }
      } else {
        setChartData(generateChartData());
      }
      
      // Setup WebSocket for real-time price updates if using API
      if (useRealTimeAPI) {
        cleanup = connectWebSocket(selectedStock, (tradeData) => {
          // Update current price
          setCurrentPrices(prev => ({
            ...prev,
            [selectedStock]: tradeData.p
          }));
          
          // Update chart if using simulated charts
          if (useSimulatedCharts) {
            setChartData(prevData => {
              const newData = [...prevData.slice(1)];
              newData.push({
                time: new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                price: tradeData.p,
                volume: tradeData.v
              });
              return newData;
            });
          }
        });
      }
      
      setIsLoading(false);
    };

    initializeData();

    return () => {
      if (cleanup) cleanup();
      if (useRealTimeAPI) {
        disconnectWebSocket();
      }
    };
  }, [useRealTimeAPI, selectedStock, useSimulatedCharts]);


  const updateStockPrices = useCallback(() => {
    if (useRealTimeAPI) {
      // Replace the example.com API call with Finnhub
      Promise.all(AVAILABLE_STOCKS.map(stock => 
        fetch(`/api/stock-proxy?endpoint=quote&symbol=${stock.symbol}`)
          .then(res => res.json())
          .then(data => ({
            symbol: stock.symbol,
            price: data.c,
            volume: data.v
          }))
      ))
      .then(results => {
        const newPrices = results.reduce((acc, { symbol, price }) => ({
          ...acc,
          [symbol]: price
        }), {});
        setCurrentPrices(newPrices);
      })
      .catch(() => {
        // Fallback to simulation if API fails
        const newPrices = AVAILABLE_STOCKS.reduce((acc, stock) => ({
          ...acc,
          [stock.symbol]: generateRandomPrice(stock.basePrice)
        }), {});
        setCurrentPrices(newPrices);
      });
    } else {
      const newPrices = AVAILABLE_STOCKS.reduce((acc, stock) => ({
        ...acc,
        [stock.symbol]: generateRandomPrice(stock.basePrice)
      }), {});
      setCurrentPrices(newPrices);
    }
  }, [useRealTimeAPI, generateRandomPrice]);
  

  const generateChartData = useCallback(() => {
    const data: ChartDataPoint[] = [];
    const basePrice = AVAILABLE_STOCKS.find(s => s.symbol === selectedStock)?.basePrice || 150;
    const baseVolume = AVAILABLE_STOCKS.find(s => s.symbol === selectedStock)?.volume || 500000;
    const volatility = 0.002; // 0.2% volatility per tick
    let currentPrice = basePrice;
    
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      
      // More realistic price movement using random walk
      const change = currentPrice * volatility * (Math.random() - 0.5);
      currentPrice += change;
      
      // Volume tends to be higher at market open and close
      const hourOfDay = date.getHours();
      let volumeMultiplier = 1;
      if (hourOfDay < 2 || hourOfDay > 22) {
        volumeMultiplier = 1.5; // Higher volume at market hours
      }
      
      data.push({
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: currentPrice,
        volume: baseVolume * volumeMultiplier * (0.7 + Math.random() * 0.6)
      });
    }
    return data;
  }, [selectedStock]);
  

  // Effects
  useEffect(() => {
    updateStockPrices();
    const interval = setInterval(updateStockPrices, useRealTimeAPI ? 60000 : 5000);
    return () => clearInterval(interval);
  }, [updateStockPrices, useRealTimeAPI]);

  useEffect(() => {
    const updateChartData = async () => {
      if (useRealTimeAPI) {
        const apiData = await fetchStockData(selectedStock);
        if (apiData) {
          // Update current prices
          setCurrentPrices(prev => ({
            ...prev,
            [selectedStock]: apiData.price
          }));
    
          // Update chart data
          setChartData(prevData => {
            const newData = [...prevData.slice(1)];
            newData.push({
              time: new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              price: apiData.price,
              volume: apiData.volume
            });
            return newData;
          });
        } else {
          simulateNewDataPoint();
        }
      } else {
        simulateNewDataPoint();
      }
    };
  
    const simulateNewDataPoint = () => {
      setChartData(prevData => {
        // Use current API price if available, otherwise use last price
        const basePrice = currentPrices[selectedStock] || prevData[prevData.length - 1].price;
        const volatility = 0.002;
        const change = basePrice * volatility * (Math.random() - 0.5);
        const newPrice = basePrice + change;
    
        const baseVolume = AVAILABLE_STOCKS.find(s => s.symbol === selectedStock)?.volume || 500000;
        const newVolume = baseVolume * (0.7 + Math.random() * 0.6);
    
        const newData = [...prevData.slice(1)];
        newData.push({
          time: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          price: newPrice,
          volume: newVolume
        });
        return newData;
      });
    };
    // Initialize chart data
    setChartData(generateChartData());
  
    // Update every 5 seconds for simulation, 1 minute for real API
    const interval = setInterval(updateChartData, useRealTimeAPI ? 15000 : 5000);
    return () => clearInterval(interval);
  }, [selectedStock, useRealTimeAPI, generateChartData]);

  useEffect(() => {
    safeStorage.setItem('userAccount', JSON.stringify(userAccount));
    safeStorage.setItem('portfolio', JSON.stringify(portfolio));
    safeStorage.setItem('transactions', JSON.stringify(transactions));
  }, [userAccount, portfolio, transactions]);

  // Trading Functions
  const executeTrade = () => {
    const currentPrice = currentPrices[selectedStock];
    const totalValue = currentPrice * tradeShares;

    if (tradeType === 'BUY') {
      if (totalValue > userAccount.cash) {
        alert('Insufficient funds');
        return false;
      }

      setUserAccount((prev: UserAccount) => ({
        ...prev,
        cash: prev.cash - totalValue
      }));

      setPortfolio(prev => {
        const existingStock = prev.find(s => s.symbol === selectedStock);
        if (existingStock) {
          const newTotalShares = existingStock.shares + tradeShares;
          const newTotalCost = existingStock.avgPrice * existingStock.shares + totalValue;
          return prev.map(s => 
            s.symbol === selectedStock 
              ? {
                  ...s,
                  shares: newTotalShares,
                  avgPrice: newTotalCost / newTotalShares,
                }
              : s
          );
        }
        return [...prev, {
          symbol: selectedStock,
          shares: tradeShares,
          avgPrice: currentPrice,
          totalCost: totalValue
        }];
      });
    } else {
      const existingStock = portfolio.find(s => s.symbol === selectedStock);
      if (!existingStock || existingStock.shares < tradeShares) {
        alert('Insufficient shares');
        return false;
      }

      setUserAccount((prev: UserAccount) => ({
        ...prev,
        cash: prev.cash + totalValue
      }));

      setPortfolio(prev => {
        const updatedPortfolio = prev.map(s => {
          if (s.symbol === selectedStock) {
            const newShares = s.shares - tradeShares;
            return newShares > 0
              ? { ...s, shares: newShares }
              : null;
          }
          return s;
        }).filter(Boolean) as PortfolioStock[];
        return updatedPortfolio;
      });
    }

    setTransactions(prev => [...prev, {
      id: Date.now().toString(),
      date: new Date(),
      symbol: selectedStock,
      type: tradeType,
      shares: tradeShares,
      price: currentPrice,
      total: totalValue
    }]);

    setShowTradeModal(false);
    return true;
  };
  return (
    <div className="min-h-screen  bg-gradient-to-br from-gray-950 via-violet-950 to-pink-950/70 p-4 md:p-8"
    style={{
      backgroundImage: `
          linear-gradient(
            to bottom right,
            rgba(3, 7, 18, 1), /* gray-950 */
            ##2e1065 /* violet-950 */
            #2d0130/* pink-950/70 */
          )
        `,
      backgroundAttachment: "fixed", // Makes background scroll slower
      backgroundSize: "cover",
      backgroundPosition: "center top", // Adjusts position for movement
    }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-transparent bg-clip-text">
              Financial Dashboard
            </h1>
            <p className="text-gray-400">Real-time market analysis and portfolio tracking</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
  
            <div className="flex items-center gap-2">
  <span className="text-sm text-white relative">
    {useRealTimeAPI && (
      <span className="absolute -top-3 left-0 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
    )}
    {useRealTimeAPI ? "Real-Time API" : "Simulation"}
  </span>
  <Switch
    checked={useRealTimeAPI}
    onCheckedChange={setUseRealTimeAPI}
    className="
      w-[44px] h-[30px]
      bg-black/10 backdrop-blur-xl 
      border border-white/10
      data-[state=checked]:bg-purple-500/90
      data-[state=checked]:border-purple-500/90
    "
  />
</div>

</div>

            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger className="bg-black/20 border w-150 rounded-xl focus:ring-2  focus:ring-purple-500/50 text-white backdrop-blur-xl border-white/10 hover:bg-white/10"
                >
                <SelectValue placeholder="Select stock" />
              </SelectTrigger>
              <SelectContent className="bg-white/10 border rounded-xl focus:ring-1  focus:ring-purple-500/50 text-white backdrop-blur-xl border-white/10 hover:bg-white/10"
  >
                {AVAILABLE_STOCKS.map(stock => (
                  <SelectItem 
                    key={stock.symbol} 
                    value={stock.symbol}
                    className="hover:bg-white/10"
                  >
                    {stock.symbol} - {stock.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
  
            <Select
              value="actions"
              
              onValueChange={(value) => {
                if (value === "trade") setShowTradeModal(true);
                if (value === "tutorial") setShowTutorial(true);
              }}
            >
              
              <Button
    onClick={() => setShowTradeModal(true)}
    className="bg-black/20 border rounded-xl focus:ring-2  focus:ring-purple-500/50 text-white backdrop-blur-xl border-white/10 hover:bg-white/10"
  >
    Trade
  </Button>
  <Button
    onClick={() => setShowTutorial(true)}
    className="w-8 h-8 text-white rounded-full bg-black/20 backdrop-blur-xl border-white/10 hover:bg-white/10 flex items-center justify-center"
  >
    ?
  </Button>
            </Select>
          </div>
        </div>
  
        {/* Current Stock Info Card */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="glass-card fade-slide-in animation-delay-100 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-red-500/5 p-8 rounded-3xl border border-white/10">
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-gray-400 text-xl">Current Price</h2>
                    <div className="text-5xl font-bold text-white mt-2">
                      ${currentPrices[selectedStock]?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-gray-400 text-xl">24h Volume</h2>
                    <div className="text-3xl font-bold text-white mt-2">
                      {AVAILABLE_STOCKS.find(s => s.symbol === selectedStock)?.volume.toLocaleString()}
                    </div>
                    <div className="text-green-400 text-sm mt-1">
                      +12.3% from average
                    </div>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Real-time price and volume data for {selectedStock}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
  
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TooltipProvider>
            {/* Portfolio Value Card */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="glass-card fade-slide-in animation-delay-200 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 p-8 rounded-3xl border border-white/10">
                  <h2 className="text-gray-400 text-xl">Total Portfolio Value</h2>
                  <div className="text-4xl font-bold text-white mt-2">
                    ${calculatePortfolioValue().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    Initial: ${userAccount.initialInvestment.toFixed(2)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total value of your portfolio including cash and stocks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Continue with other cards... */}
        {/* Continue Portfolio Summary Cards */}
        <TooltipProvider>
          {/* Available Cash Card */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="glass-card fade-slide-in animation-delay-300 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 p-8 rounded-3xl border border-white/10">
                <h2 className="text-gray-400 text-xl">Available Cash</h2>
                <div className="text-4xl font-bold text-white mt-2">
                  ${userAccount.cash.toFixed(2)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cash available for trading</p>
            </TooltipContent>
          </Tooltip>

          {/* Profit/Loss Card */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="glass-card fade-slide-in animation-delay-900 bg-gradient-to-br from-blue-500/5 via-red-500/5 to-pink-500/5 p-8 rounded-3xl border border-white/10">
                <h2 className="text-gray-400 text-xl">Profit/Loss</h2>
                <div className={`text-4xl font-bold mt-2 ${
                  calculateProfitLoss() >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {calculateProfitLoss().toFixed(2)}%
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your total return on investment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Chart */}
        <div className="glass-card bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-red-500/10 p-6 rounded-3xl border border-white/10">
  <h2 className="text-xl font-bold mb-4">Price Chart</h2>
  <div className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="time"
          stroke="rgba(255,255,255,0.5)"
          tick={{ fill: 'rgba(255,255,255,0.5)' }}
        />
        <YAxis
          domain={['auto', 'auto']}
          stroke="rgba(255,255,255,0.5)"
          tick={{ fill: 'rgba(255,255,255,0.5)' }}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px'
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>


        {/* Volume Chart */}
<div className="glass-card bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-red-500/10 p-6 rounded-3xl border border-white/10">
  <h2 className="text-xl font-bold mb-4">Volume Analysis</h2>
  <div className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="time" 
          stroke="rgba(255,255,255,0.5)"
          tick={{ fill: 'rgba(255,255,255,0.5)' }}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)"
          tick={{ fill: 'rgba(255,255,255,0.5)' }}
          tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
        />
        
        <RechartsTooltip 
          
          contentStyle={{ 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)'
          }}
          formatter={(value: number) => [
            `${(value / 1000000).toFixed(2)}M`,
            'Volume'
          ]}
        />
        
        <Bar 
          dataKey="volume" 
          fill="#4c1d95"
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

      </div>

      {/* Portfolio Holdings Table */}
      <div className="glass-card fade-slide-in bg-black/10 p-8 rounded-3xl border border-white/10">
        <h2 className="text-xl font-bold mb-4">Portfolio Holdings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left pb-4">Symbol</th>
                <th className="text-right pb-4">Shares</th>
                <th className="text-right pb-4">Avg Price</th>
                <th className="text-right pb-4">Current Price</th>
                <th className="text-right pb-4">Total Value</th>
                <th className="text-right pb-4">Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map(stock => {
                const currentPrice = currentPrices[stock.symbol] || 0;
                const totalValue = stock.shares * currentPrice;
                const profitLoss = ((currentPrice - stock.avgPrice) / stock.avgPrice) * 100;

                return (
                  <tr key={stock.symbol} className="border-b border-white/10">
                    <td className="py-4 font-medium">{stock.symbol}</td>
                    <td className="text-right py-4">{stock.shares}</td>
                    <td className="text-right py-4">${stock.avgPrice.toFixed(2)}</td>
                    <td className="text-right py-4">${currentPrice.toFixed(2)}</td>
                    <td className="text-right py-4">${totalValue.toFixed(2)}</td>
                    <td className={`text-right py-4 ${
                      profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {profitLoss.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">
              Trade {selectedStock}
            </h2>
            
            <div className="space-y-6">
              {/* Trade Type Selector */}
              <div>
                <label className="block text-gray-400 mb-2">Trade Type</label>
                <Select value={tradeType} onValueChange={(value: 'BUY' | 'SELL') => setTradeType(value)}>
                  <SelectTrigger className="w-full bg-black/20 backdrop-blur-xl text-white border border-white/20 hover:border-white/40 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                    <SelectValue placeholder="Select trade type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/10 rounded-xl backdrop-blur-xl border-white/10">
                    <SelectItem value="BUY" className="text-green-400 ">Buy</SelectItem>
                    <SelectItem value="SELL" className="text-red-400 ">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shares Input */}
              <div>
                <label className="block text-gray-400 mb-2">Number of Shares</label>
                <input
                  type="number"
                  min="1"
                  value={tradeShares}
                  onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-black/20 backdrop-blur-xl text-white border border-white/20 hover:border-white/40 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Trade Summary */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex justify-between text-gray-400">
                  <span>Price per Share:</span>
                  <span>${currentPrices[selectedStock]?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white text-lg font-bold">
                  <span>Total Value:</span>
                  <span>${(currentPrices[selectedStock] * tradeShares || 0).toFixed(2)}</span>
                </div>
                {tradeType === 'BUY' && (
                  <div className="flex justify-between text-gray-400">
                    <span>Available Cash:</span>
                    <span>${userAccount.cash.toFixed(2)}</span>
                  </div>
                )}
                {tradeType === 'SELL' && (
                  <div className="flex justify-between text-gray-400">
                    <span>Available Shares:</span>
                    <span>{portfolio.find(s => s.symbol === selectedStock)?.shares || 0}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {/* Action Buttons */}
<div className="flex gap-4">
  <Button
    onClick={() => setShowTradeModal(false)}
    className="bg-black/20 border rounded-xl focus:ring-2  focus:ring-purple-500/50 text-white backdrop-blur-xl border-white/10 hover:bg-white/10"
  >
    Cancel
  </Button>
  <Button
    onClick={executeTrade}
    className="bg-purple-500/20 flex-1 border rounded-xl focus:ring-2  focus:ring-purple-500/50 text-white backdrop-blur-xl border-purple-500/30 hover:bg-purple-500/30"
    //className="flex-1 bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30"
    disabled={!tradeShares}
  >
    Confirm Trade
  </Button>
</div>

            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">Welcome to the Trading Dashboard</h2>
            
            <div className="space-y-4 text-gray-300">
              <p>Here's how to get started:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Select a stock from the dropdown menu</li>
                <li>Monitor real-time price changes and volume</li>
                <li>Use the Trade button to buy or sell shares</li>
                <li>Track your portfolio performance and profit/loss</li>
                <li>View detailed charts and analysis</li>
              </ol>
              
              <div className="mt-8">
              <Button
    onClick={() => setShowTutorial(false)}
    className="bg-black/20 border rounded-xl focus:ring-2 focus:ring-purple-500/50 text-white backdrop-blur-xl border-white/10 hover:bg-white/10"
  
  >
    Got it!
  </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  
);
};


const styles = `
.glass-card {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  transition: all 0.3s ease;
}

.glass-card:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}
`;

export default FinancialDashboard;
  