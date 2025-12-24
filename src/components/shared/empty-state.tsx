import { ReactNode } from 'react';
import { Cards } from '../custom/cards/cards';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
}

export const EmptyState = ({ icon, title, message }: EmptyStateProps) => {
  return (
    <div className="p-6">
      <Cards className="p-10 text-center">
        <div className="w-20 h-20 mx-auto mb-4 text-gray-900">
          {icon}
        </div>
        <h3 className="text-3xl font-black mb-2 text-gray-900">{title}</h3>
        <p className="text-lg font-bold text-gray-700">{message}</p>
      </Cards>
    </div>
  );
};
