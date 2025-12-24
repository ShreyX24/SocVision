import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ThermalData } from '../../types';
import { getTemperatureColor } from '../../utils/colors';

interface TemperatureChartProps {
  data: ThermalData;
  height?: number;
}

export const TemperatureChart = memo(({ data, height = 200 }: TemperatureChartProps) => {
  const chartData = data.coreTemps.map(core => ({
    core: `C${core.core}`,
    temp: core.temperature,
    fill: getTemperatureColor(core.temperature, data.tjMax || 100)
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
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
          domain={[0, data.tjMax || 100]}
          tickFormatter={(value) => `${value}°C`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '2px solid #111827',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
          formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
        />
        {data.tjMax && (
          <ReferenceLine
            y={data.tjMax - 10}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'Thermal Limit', fill: '#ef4444', fontSize: 10 }}
          />
        )}
        <Bar dataKey="temp" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

TemperatureChart.displayName = 'TemperatureChart';
