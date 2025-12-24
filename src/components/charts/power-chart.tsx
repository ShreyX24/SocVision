import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PowerData } from '../../types';

interface PowerChartProps {
  data: PowerData;
  height?: number;
}

const POWER_COLORS = {
  package: '#ef4444',
  core: '#f97316',
  gt: '#10b981',
  uncore: '#8b5cf6',
  dram: '#06b6d4'
};

export const PowerChart = memo(({ data, height = 200 }: PowerChartProps) => {
  const chartData = [
    { name: 'Package', value: data.package, fill: POWER_COLORS.package },
    { name: 'Core', value: data.core, fill: POWER_COLORS.core },
    { name: 'GT/GPU', value: data.gt, fill: POWER_COLORS.gt }
  ];

  if (data.uncore) {
    chartData.push({ name: 'Uncore', value: data.uncore, fill: POWER_COLORS.uncore });
  }
  if (data.dram) {
    chartData.push({ name: 'DRAM', value: data.dram, fill: POWER_COLORS.dram });
  }

  // Filter out zero values
  const filteredData = chartData.filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeWidth={1} />
        <XAxis
          dataKey="name"
          stroke="#111827"
          strokeWidth={1}
          style={{ fontSize: '10px' }}
          tick={{ fontWeight: 'bold' }}
        />
        <YAxis
          stroke="#111827"
          strokeWidth={1}
          style={{ fontSize: '10px' }}
          tick={{ fontWeight: 'bold' }}
          tickFormatter={(value) => `${value.toFixed(1)}W`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '2px solid #111827',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
          formatter={(value: number) => [`${value.toFixed(2)} W`, 'Power']}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {filteredData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

PowerChart.displayName = 'PowerChart';
