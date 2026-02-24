import React from 'react';
import { Card } from '@/components/ui/card';

const StatCard = ({ title, value, subtitle, icon }) => {
  return (
    <Card className="bg-white border border-slate-200 p-6 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className="text-3xl font-bold font-heading text-slate-900" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </Card>
  );
};

export default StatCard;