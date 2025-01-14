import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Modal } from '@/components/ui/Modal';
import { AVAILABLE_STOCKS } from '@/lib/constants';
import { TradeModalProps } from '@/lib/types';

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  tradeStock,
  setTradeStock,
  tradeType,
  setTradeType,
  tradeShares,
  setTradeShares,
  currentPrice,
  onConfirmTrade,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="glass-card rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Trade Stock</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stock</label>
            <Select
              value={tradeStock}
              onValueChange={setTradeStock}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stock" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_STOCKS.map(stock => (
                  <SelectItem key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Trade Type</label>
            <div className="flex gap-2">
              <Button
                onClick={() => setTradeType('BUY')}
                className={`flex-1 ${tradeType === 'BUY' ? 'bg-green-600' : 'glass-card'}`}
              >
                Buy
              </Button>
              <Button
                onClick={() => setTradeType('SELL')}
                className={`flex-1 ${tradeType === 'SELL' ? 'bg-red-600' : 'glass-card'}`}
              >
                Sell
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Shares</label>
            <input
              type="number"
              min="1"
              value={tradeShares}
              onChange={(e) => setTradeShares(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20"
            />
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between mb-2">
              <span>Price per Share:</span>
              <span>${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Total:</span>
              <span>${(currentPrice * tradeShares).toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onClose}
                className="flex-1 glass-card"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirmTrade}
                className="flex-1 bg-blue-600"
                disabled={!tradeStock || !tradeShares}
              >
                Confirm Trade
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
