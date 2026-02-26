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
    <div className="w-64 bg-gradient-to-b from-brand-blue to-brand-blue/90 min-h-screen flex flex-col shadow-xl" data-testid="sidebar">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <img src="/saps-logo.png" alt="SAPS Logo" className="h-12 w-auto" />
        </div>
        <p className="text-xs text-white/80 mt-2">Skills and Placement Services</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-brand-blue shadow-md'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-white/60 text-center">
          Powered by AI
        </div>
      </div>
    </div>
  );
};

export default Sidebar;