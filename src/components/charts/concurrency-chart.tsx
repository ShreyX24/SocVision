import { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ConcurrencyData } from '../../types';
import { concurrencyColors } from '../../utils/colors';

interface ConcurrencyChartProps {
  data: ConcurrencyData;
  height?: number;
}

export const ConcurrencyChart = memo(({ data, height = 250 }: ConcurrencyChartProps) => {
  const chartData = [
    { name: 'CPU Only', value: data.cpuOnly, fill: concurrencyColors.cpuOnly },
    { name: 'iGPU Only', value: data.gpuOnly, fill: concurrencyColors.gpuOnly },
    { name: 'Both Active', value: data.concurrent, fill: concurrencyColors.concurrent },
    { name: 'Both Idle', value: data.bothIdle, fill: concurrencyColors.bothIdle }
  ].filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} stroke="#111827" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '2px solid #111827',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Time']}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          formatter={(value) => <span style={{ color: '#111827' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

ConcurrencyChart.displayName = 'ConcurrencyChart';
