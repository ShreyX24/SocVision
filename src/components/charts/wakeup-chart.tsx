import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WakeupEntry } from '../../types';

interface WakeupChartProps {
  data: WakeupEntry[];
  height?: number;
  title?: string;
}

const WAKEUP_COLORS = [
  '#4338ca', // CLK - Indigo
  '#10b981', // DPC - Green
  '#f97316', // INT - Orange
  '#8b5cf6', // RDY - Purple
  '#9ca3af'  // UNKNOWN - Gray
];

export const WakeupChart = memo(({ data, height = 250 }: WakeupChartProps) => {
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sortedData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeWidth={1} />
        <XAxis
          type="number"
          stroke="#111827"
          strokeWidth={1}
          style={{ fontSize: '10px' }}
          tick={{ fontWeight: 'bold' }}
        />
        <YAxis
          type="category"
          dataKey="source"
          stroke="#111827"
          strokeWidth={1}
          style={{ fontSize: '10px' }}
          tick={{ fontWeight: 'bold' }}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '2px solid #111827',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
          formatter={(value: number) => [`${value}`, 'Count']}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {sortedData.map((_, idx) => (
            <Cell key={idx} fill={WAKEUP_COLORS[idx % WAKEUP_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

WakeupChart.displayName = 'WakeupChart';
