import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  primary: {
    icon: 'text-primary-600 bg-primary-100',
    text: 'text-primary-600',
  },
  green: {
    icon: 'text-green-600 bg-green-100',
    text: 'text-green-600',
  },
  yellow: {
    icon: 'text-yellow-600 bg-yellow-100',
    text: 'text-yellow-600',
  },
  red: {
    icon: 'text-red-600 bg-red-100',
    text: 'text-red-600',
  },
  gray: {
    icon: 'text-gray-600 bg-gray-100',
    text: 'text-gray-600',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="stat-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`ml-2 text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
