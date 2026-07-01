'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface LeverageTradeWidgetProps {
  marketId: string;
  currentPrice: number;
  marketName: string;
}

export default function LeverageTradeWidget({ 
  marketId, 
  currentPrice,
  marketName 
}: LeverageTradeWidgetProps) {
  const { address } = useAccount();
  
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [margin, setMargin] = useState<string>('');
  const [leverage, setLeverage] = useState<number>(1);
  const [liquidationPrice, setLiquidationPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Calculate liquidation price when inputs change
  useEffect(() => {
    if (currentPrice && leverage) {
      calculateLiquidation();
    }
  }, [side, currentPrice, leverage]);

  const calculateLiquidation = async () => {
    try {
      const response = await fetch('/api/leverage/calculate-liquidation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          entryPrice: currentPrice,
          leverage
        })
      });

      const data = await response.json();
      if (data.success) {
        setLiquidationPrice(data.liquidationPrice);
      }
    } catch (err) {
      console.error('Error calculating liquidation:', err);
    }
  };

  const handleOpenPosition = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!margin || parseFloat(margin) <= 0) {
      setError('Please enter a valid margin amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/leverage/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: address,
          marketId,
          side,
          margin: parseFloat(margin),
          leverage
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Position opened successfully!');
        setMargin('');
        // Refresh positions list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to open position');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open position');
    } finally {
      setLoading(false);
    }
  };

  const notionalSize = margin ? parseFloat(margin) * leverage : 0;
  const maxLoss = margin ? parseFloat(margin) : 0;
  const priceToLiquidation = liquidationPrice && currentPrice 
    ? Math.abs((liquidationPrice - currentPrice) / currentPrice * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Leverage Trade</h2>
      
      {/* Market Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <div className="text-sm text-gray-600">Market</div>
        <div className="font-semibold">{marketName}</div>
        <div className="mt-2 text-sm text-gray-600">Current Price</div>
        <div className="text-lg font-bold">${currentPrice.toFixed(4)}</div>
      </div>

      {/* Side Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Position Side</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSide('YES')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              side === 'YES'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            YES
          </button>
          <button
            onClick={() => setSide('NO')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              side === 'NO'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            NO
          </button>
        </div>
      </div>

      {/* Margin Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Margin (USDC)
        </label>
        <input
          type="number"
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          placeholder="Enter margin amount"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="0"
          step="0.01"
        />
      </div>

      {/* Leverage Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Leverage</label>
          <span className="text-lg font-bold text-blue-600">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1x</span>
          <span>2x</span>
          <span>3x</span>
          <span>4x</span>
          <span>5x</span>
        </div>
      </div>

      {/* Calculations Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Notional Size:</span>
          <span className="font-semibold">${notionalSize.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Liquidation Price:</span>
          <span className="font-semibold">${liquidationPrice.toFixed(4)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Distance to Liquidation:</span>
          <span className={`font-semibold ${priceToLiquidation < 5 ? 'text-red-500' : ''}`}>
            {priceToLiquidation.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Max Loss:</span>
          <span className="font-semibold text-red-600">-${maxLoss.toFixed(2)}</span>
        </div>
      </div>

      {/* Warnings */}
      {leverage >= 4 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-semibold text-yellow-800">High Leverage Warning</div>
              <div className="text-sm text-yellow-700">
                {leverage}x leverage amplifies both gains and losses. Small price movements can trigger liquidation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Open Position Button */}
      <button
        onClick={handleOpenPosition}
        disabled={loading || !margin}
        className={`w-full py-4 rounded-lg font-bold text-white transition-all ${
          loading || !margin
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {loading ? 'Opening Position...' : 'Open Position'}
      </button>

      {/* Risk Disclaimer */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <strong>Risk Disclaimer:</strong> Leverage trading carries significant risk. 
        You can lose your entire margin if the market moves against you. 
        Only trade with funds you can afford to lose.
      </div>
    </div>
  );
}
