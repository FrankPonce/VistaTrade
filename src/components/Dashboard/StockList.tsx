import React from 'react';
import { Button } from '@/components/ui/button';
import { AVAILABLE_STOCKS } from '@/lib/constants';

interface StockListProps {
  currentPrice: number;
  priceChange: number;
  onTradeClick: (symbol: string) => void;
}

export const StockList: React.FC<StockListProps> = ({
  currentPrice,
  priceChange,
  onTradeClick,
}) => {
  return (
    <div className="glass-card glow rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Available Stocks</h3>
        <Button 
          onClick={() => onTradeClick('')}
          className="glass-card hover:bg-white/20"
        >
          Trade
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_STOCKS.map(stock => (
          <div 
            key={stock.symbol}
            className="glass-card p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-all"
            onClick={() => onTradeClick(stock.symbol)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold">{stock.symbol}</h4>
                <p className="text-sm text-gray-400">{stock.name}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                {stock.sector}
              </span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-lg font-bold">${currentPrice.toFixed(2)}</span>
              <span className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
