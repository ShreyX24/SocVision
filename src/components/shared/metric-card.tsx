import { ReactNode } from 'react';
import { BtnBgShadow } from '../custom/buttons/btn-bg-shadow';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  bgColor?: string;
  textColor?: string;
  subtitle?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon,
  bgColor = '#ffffff',
  textColor = '#111827',
  subtitle
}: MetricCardProps) => {
  return (
    <div className="relative">
      <BtnBgShadow borderRadius="4" translate="3" />
      <div
        className="relative z-10 border-[3px] border-gray-900 rounded-[4px] p-4"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">{title}</p>
            <p className="text-2xl font-black" style={{ color: textColor }}>
              {value}
              {unit && <span className="text-sm font-bold ml-1">{unit}</span>}
            </p>
            {subtitle && (
              <p className="text-xs font-bold text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-[4px] border-[2px] border-gray-900 bg-white">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
