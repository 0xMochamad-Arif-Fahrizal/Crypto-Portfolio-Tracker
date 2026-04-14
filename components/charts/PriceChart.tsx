'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  coin: 'bitcoin' | 'ethereum' | 'tether';
  symbol: 'BTC' | 'ETH' | 'USDT';
  color: string;
}

interface ChartDataPoint {
  date: string;
  price: number;
}

export default function PriceChart({ coin, symbol, color }: PriceChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    fetchChartData();
  }, [coin, selectedDays]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/history?coin=${coin}&days=${selectedDays}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const chartData = await response.json();
      setData(chartData);
    } catch (err: any) {
      console.error('Error fetching chart data:', err);
      setError('Chart unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 font-mono">
          <p className="text-xs text-zinc-500">{data.date}</p>
          <p className="text-sm font-semibold text-white">
            ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-[250px] bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse flex items-center justify-center card-glow">
        <p className="text-zinc-600 text-sm font-mono">Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[250px] bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center card-glow">
        <p className="text-red-400 text-sm font-mono">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Day selector buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedDays(7)}
          className={`px-3 py-1 rounded text-sm font-medium font-mono transition-colors ${
            selectedDays === 7
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          7D
        </button>
        <button
          onClick={() => setSelectedDays(30)}
          className={`px-3 py-1 rounded text-sm font-medium font-mono transition-colors ${
            selectedDays === 30
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          30D
        </button>
        <button
          onClick={() => setSelectedDays(90)}
          className={`px-3 py-1 rounded text-sm font-medium font-mono transition-colors ${
            selectedDays === 90
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          90D
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#ffffff', fontSize: 12, fontFamily: 'Courier Prime, monospace' }}
            stroke="#71717a"
          />
          <YAxis
            tick={{ fill: '#ffffff', fontSize: 12, fontFamily: 'Courier Prime, monospace' }}
            stroke="#71717a"
            tickFormatter={(value) => `${value.toLocaleString()}`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
