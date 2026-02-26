import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, Sparkles } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'from-brand-blue to-brand-cyan' },
    { path: '/resumes', icon: FileText, label: 'Resumes', color: 'from-brand-cyan to-blue-400' },
    { path: '/jobs', icon: Briefcase, label: 'Job Descriptions', color: 'from-brand-orange to-brand-yellow' },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen flex flex-col shadow-2xl relative overflow-hidden" data-testid="sidebar">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-24 h-24 bg-brand-magenta/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-20 h-20 bg-brand-orange/10 rounded-full blur-2xl" />
      
      <div className="p-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <img src="/saps-logo.png" alt="SAPS Logo" className="h-12 w-auto drop-shadow-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-brand-yellow" />
          <p className="text-xs text-white/70 font-medium">Skills and Placement Services</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-brand-blue/25 scale-[1.02]`
                  : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 relative z-10">
        <div className="bg-gradient-to-r from-brand-blue/20 to-brand-cyan/20 rounded-xl p-3 border border-brand-cyan/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-brand-cyan" />
            <span className="text-xs font-medium text-white/90">AI-Powered</span>
          </div>
          <p className="text-[10px] text-white/50">Smart matching technology</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;