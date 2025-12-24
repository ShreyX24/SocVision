import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { PackageCStateData } from '../../types';
import { packageCStateColors } from '../../utils/colors';

interface PackageStateChartProps {
  data: PackageCStateData;
  height?: number;
  variant?: 'bar' | 'pie';
}

export const PackageStateChart = memo(({ data, height = 250, variant = 'bar' }: PackageStateChartProps) => {
  const chartData = [
    { name: 'PC0 (Active)', value: data.pc0, fill: packageCStateColors.pc0 },
    { name: 'PC2 (Shallow)', value: data.pc2, fill: packageCStateColors.pc2 },
    { name: 'PC6 (Deep)', value: data.pc6, fill: packageCStateColors.pc6 },
    { name: 'PC10 (Deepest)', value: data.pc10, fill: packageCStateColors.pc10 }
  ];

  if (variant === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            labelLine={{ stroke: '#111827', strokeWidth: 1 }}
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
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Residency']}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeWidth={1} />
        <XAxis
          type="number"
          stroke="#111827"
          strokeWidth={1}
          style={{ fontSize: '10px' }}
          tick={{ fontWeight: 'bold' }}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#111827"
          strokeWidth={1}
          style={{ fontSize: '10px' }}
          tick={{ fontWeight: 'bold' }}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '2px solid #111827',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Residency']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

PackageStateChart.displayName = 'PackageStateChart';
