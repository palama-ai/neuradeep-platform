import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Key, BarChart3, Settings, LogOut, Zap, Cpu, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-[var(--surface-hover)] text-white shadow-lg border border-[var(--border)]'
          : 'text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <aside className="w-72 bg-sidebar border-r border-[var(--border)] flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="NeuraDeepAI Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
          <span className="text-2xl font-display font-bold text-white tracking-tight">
            NeuraDeep<span className="text-text-secondary">AI</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 px-4 sticky top-0 bg-sidebar py-2 z-10">
          Main Menu
        </div>
        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
        <SidebarItem to="/dashboard/users" icon={Users} label="Users" />
        <SidebarItem to="/dashboard/keys" icon={Key} label="API Keys" />
        <SidebarItem to="/dashboard/models" icon={Cpu} label="Models" />
        <SidebarItem to="/dashboard/analytics" icon={BarChart3} label="Analytics" />
        <SidebarItem to="/dashboard/feedbacks" icon={MessageSquare} label="Feedbacks" />
      </nav>

      <div className="p-4 mt-auto space-y-4 border-t border-[var(--border)] bg-sidebar">
        <div className="bg-surface rounded-2xl p-4 border border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-white font-bold border border-[var(--border)]">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white truncate max-w-[140px]">
                {user?.fullName || 'User'}
              </span>
              <span className="text-xs text-text-secondary capitalize">{user?.role || 'Member'}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-[rgba(255,255,255,0.05)] hover:text-white rounded-lg transition-colors border border-transparent hover:border-[var(--border)]"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded-xl transition-colors font-medium group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
