import React from 'react';
import { Card } from '@/components/ui/card';

const StatCard = ({ title, value, subtitle, icon, colorScheme = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-brand-blue to-brand-cyan border-brand-cyan/30',
    orange: 'bg-gradient-to-br from-brand-orange to-brand-yellow border-brand-orange/30',
    magenta: 'bg-gradient-to-br from-brand-magenta to-pink-400 border-brand-magenta/30',
    cyan: 'bg-gradient-to-br from-brand-cyan to-blue-400 border-brand-cyan/30'
  };

  return (
    <Card className={`${colorClasses[colorScheme]} border-2 p-6 flex flex-col gap-2 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`} data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/90">{title}</p>
        {icon && <span className="text-white/80">{icon}</span>}
      </div>
      <p className="text-4xl font-bold font-heading text-white drop-shadow-lg" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
      {subtitle && <p className="text-xs text-white/80">{subtitle}</p>}
    </Card>
  );
};

export default StatCard;