import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CoreStateData } from '../../types';
import { coreTypeColors } from '../../utils/colors';

interface ActivityChartProps {
  data: CoreStateData[];
  height?: number;
}

export const ActivityChart = memo(({ data, height = 250 }: ActivityChartProps) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeWidth={1} />
      <XAxis
        dataKey="core"
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
        domain={[0, 100]}
        tickFormatter={(value) => `${value}%`}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: '#fff',
          border: '2px solid #111827',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold'
        }}
        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Active']}
      />
      <Bar dataKey="active" name="Active %" radius={[2, 2, 0, 0]}>
        {data.map((entry, idx) => (
          <Cell key={idx} fill={coreTypeColors[entry.type] || coreTypeColors.Unknown} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
));

ActivityChart.displayName = 'ActivityChart';
