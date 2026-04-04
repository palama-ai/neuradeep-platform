import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Key, BarChart3, Settings, LogOut, Zap, Cpu } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-brand-600 text-white shadow-lg shadow-brand-200'
          : 'text-gray-500 hover:bg-gray-50 hover:text-brand-600'
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
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="bg-brand-600 p-2 rounded-lg">
            <Zap className="text-white" size={24} fill="currentColor" />
          </div>
          <span className="text-2xl font-display font-bold text-gray-900 tracking-tight">
            NeuraDeep<span className="text-brand-600">AI</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
          Main Menu
        </div>
        <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
        <SidebarItem to="/dashboard/users" icon={Users} label="Users" />
        <SidebarItem to="/dashboard/keys" icon={Key} label="API Keys" />
        <SidebarItem to="/dashboard/models" icon={Cpu} label="Models" />
        <SidebarItem to="/dashboard/analytics" icon={BarChart3} label="Analytics" />
      </nav>

      <div className="p-4 space-y-4">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 truncate max-w-[140px]">
                {user?.fullName || 'User'}
              </span>
              <span className="text-xs text-gray-500 capitalize">{user?.role || 'Member'}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-brand-600 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
