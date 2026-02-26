import React from 'react';

const Header = ({ title, subtitle, action }) => {
  return (
    <div className="bg-gradient-to-r from-white via-brand-cyan/5 to-white backdrop-blur-md border-b border-brand-cyan/10 sticky top-0 z-50 px-8 py-6" data-testid="page-header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent" data-testid="page-title">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default Header;