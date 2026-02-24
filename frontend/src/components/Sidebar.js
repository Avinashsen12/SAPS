import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/resumes', icon: FileText, label: 'Resumes' },
    { path: '/jobs', icon: Briefcase, label: 'Job Descriptions' },
  ];

  return (
    <div className="w-64 bg-primary min-h-screen flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold font-heading text-primary-foreground" data-testid="app-logo">SAPS</h1>
        <p className="text-xs text-slate-400 mt-1">Precision Talent Placement with AI</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;