'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationDonutChartProps {
  btcTotalValue: number;
  ethTotalValue: number;
  usdtTotalValue: number;
}

const COLORS = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  USDT: '#26A17B',
};

export default function AllocationDonutChart({
  btcTotalValue,
  ethTotalValue,
  usdtTotalValue,
}: AllocationDonutChartProps) {
  // Safe values to prevent NaN
  const safeBTC = isNaN(btcTotalValue) ? 0 : btcTotalValue;
  const safeETH = isNaN(ethTotalValue) ? 0 : ethTotalValue;
  const safeUSDT = isNaN(usdtTotalValue) ? 0 : usdtTotalValue;
  
  const total = safeBTC + safeETH + safeUSDT;

  // Prepare data for chart
  const data = [
    { name: 'BTC', value: safeBTC, percentage: total > 0 ? (safeBTC / total) * 100 : 0 },
    { name: 'ETH', value: safeETH, percentage: total > 0 ? (safeETH / total) * 100 : 0 },
    { name: 'USDT', value: safeUSDT, percentage: total > 0 ? (safeUSDT / total) * 100 : 0 },
  ].filter(item => item.value > 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg font-mono">
          <p className="font-bold text-white text-sm">{data.name}</p>
          <p className="text-xs text-zinc-400 mt-1">
            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-zinc-500 font-bold">
            {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-col gap-3 mt-6">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center justify-between font-mono">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-bold text-white">{entry.value}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400">
                ${entry.payload.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm text-white font-bold min-w-[3rem] text-right">
                {entry.payload.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">
          Asset Allocation
        </h3>
        <div className="flex items-center justify-center h-64 text-zinc-600 font-mono text-sm">
          <p>No assets to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 card-glow">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-mono">
        Asset Allocation
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="#18181b"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
