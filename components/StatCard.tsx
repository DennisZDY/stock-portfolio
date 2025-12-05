import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  subValueColor?: string;
  footer?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, subValueColor, footer, highlight, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-3 rounded-lg shadow-sm border ${highlight ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <h3 className="text-gray-500 text-xs font-medium mb-1">{title}</h3>
      <div className="text-base md:text-lg font-bold text-gray-900 mb-0.5">{value}</div>
      {subValue && (
        <div className={`text-xs font-semibold ${subValueColor || 'text-gray-600'}`}>
          {subValue}
        </div>
      )}
      {footer && (
        <div className="text-xs text-gray-400 mt-1">
          {footer}
        </div>
      )}
    </div>
  );
};