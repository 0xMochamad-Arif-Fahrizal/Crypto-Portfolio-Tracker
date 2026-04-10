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
  ].filter(item => item.value > 0); // Only show coins with value

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500">
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
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-gray-700">{entry.value}</span>
            </div>
            <span className="text-sm text-gray-600">
              {entry.payload.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Asset Allocation</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No assets to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Asset Allocation</h3>
      
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
