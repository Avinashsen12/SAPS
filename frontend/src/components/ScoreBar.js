import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ScoreBar = ({ score, category }) => {
  const getColorClasses = () => {
    if (score >= 80) return { bg: '#DCFCE7', bar: '#16A34A', text: '#15803D' };
    if (score >= 60) return { bg: '#FEF9C3', bar: '#CA8A04', text: '#854D0E' };
    if (score >= 50) return { bg: '#FFEDD5', bar: '#F97316', text: '#9A3412' };
    return { bg: '#FEE2E2', bar: '#DC2626', text: '#991B1B' };
  };

  const colors = getColorClasses();

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: colors.bar }}
        />
      </div>
      <span className="font-mono text-sm font-semibold min-w-[60px] text-right" style={{ color: colors.text }}>
        {score.toFixed(1)}%
      </span>
    </div>
  );
};

export default ScoreBar;