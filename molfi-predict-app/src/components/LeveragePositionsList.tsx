'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface LeveragePosition {
  position_id: string;
  market_id: string;
  market_type: string;
  side: 'YES' | 'NO';
  margin: number;
  leverage: number;
  size: number;
  entry_price: number;
  liquidation_price: number;
  current_pnl: number;
  status: string;
  opened_at: string;
}

export default function LeveragePositionsList() {
  const { address } = useAccount();
  
  const [positions, setPositions] = useState<LeveragePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'CLOSED' | 'LIQUIDATED'>('OPEN');

  useEffect(() => {
    if (address) {
      fetchPositions();
      // Refresh every 5 seconds
      const interval = setInterval(fetchPositions, 5000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchPositions = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/leverage/positions?userId=${address}`);
      const data = await response.json();

      if (data.success) {
        setPositions(data.positions);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch positions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    if (!address) return;

    setClosingId(positionId);
    setError('');

    try {
      const response = await fetch(`/api/leverage/positions/${positionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh positions
        await fetchPositions();
      } else {
        setError(data.error || 'Failed to close position');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to close position');
    } finally {
      setClosingId(null);
    }
  };

  const filteredPositions = positions.filter(p => 
    filter === 'all' || p.status === filter
  );

  const getHealthColor = (position: LeveragePosition, currentPrice: number) => {
    const distanceToLiquidation = Math.abs(
      (position.liquidation_price - currentPrice) / currentPrice
    );
    
    if (distanceToLiquidation < 0.05) return 'text-red-600';
    if (distanceToLiquidation < 0.10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!address) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Please connect your wallet to view positions</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Leverage Positions</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('OPEN')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'OPEN' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('CLOSED')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'CLOSED' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setFilter('LIQUIDATED')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'LIQUIDATED' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Liquidated
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Positions Table */}
      {filteredPositions.length === 0 ? (
        <div className="p-6 text-center text-gray-600">
          No {filter !== 'all' && filter.toLowerCase()} positions found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liquidation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PnL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPositions.map((position) => (
                <tr key={position.position_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {position.market_id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      position.side === 'YES' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {position.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${position.margin.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {position.leverage}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${position.size.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${position.entry_price.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${position.liquidation_price.toFixed(4)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getPnLColor(position.current_pnl)}`}>
                    {position.current_pnl >= 0 ? '+' : ''}
                    ${position.current_pnl.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      position.status === 'OPEN' 
                        ? 'bg-blue-100 text-blue-800' 
                        : position.status === 'CLOSED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {position.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {position.status === 'OPEN' && (
                      <button
                        onClick={() => handleClosePosition(position.position_id)}
                        disabled={closingId === position.position_id}
                        className="text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
                      >
                        {closingId === position.position_id ? 'Closing...' : 'Close'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      {filteredPositions.length > 0 && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Positions</div>
              <div className="text-lg font-bold">{filteredPositions.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Margin</div>
              <div className="text-lg font-bold">
                ${filteredPositions.reduce((sum, p) => sum + p.margin, 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total PnL</div>
              <div className={`text-lg font-bold ${getPnLColor(
                filteredPositions.reduce((sum, p) => sum + p.current_pnl, 0)
              )}`}>
                {filteredPositions.reduce((sum, p) => sum + p.current_pnl, 0) >= 0 ? '+' : ''}
                ${filteredPositions.reduce((sum, p) => sum + p.current_pnl, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
