import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'CLOSED':
        return 'bg-slate-50 text-slate-600 ring-slate-500/10';
      case 'ON_HOLD':
        return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
      default:
        return 'bg-slate-50 text-slate-600 ring-slate-500/10';
    }
  };

  const displayText = status === 'ON_HOLD' ? 'On Hold' : status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusClasses()}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;