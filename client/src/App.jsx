// f:/palama-persona-v1/neuradeepai-platform/client/src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

// Stores & Components
import useAuthStore from './store/useAuthStore';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UsersPage from './pages/UsersPage';
import KeysPage from './pages/KeysPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ConfigPage from './pages/ConfigPage';

// Layout Components
const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans border-t-4 border-brand-600">
    <Outlet />
  </div>
);

const DashboardLayout = () => (
  <div className="flex h-screen bg-gray-50/30 overflow-hidden">
    <Sidebar />
    <main className="flex-1 p-8 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

// Secure Admin Guard
const AdminGuard = ({ children }) => {
  const { user, token } = useAuthStore();
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/auth/login" />;
  }
  return children;
};

// Dashboard Overview with Real Data
const DashboardOverview = () => {
  const { user, token } = useAuthStore();
  const [summary, setSummary] = useState({ totalUsers: 0, activeKeys: 0, totalTokens: 0, successRate: '99.9%' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('/api/v1/admin/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSummary(response.data);
      } catch (err) {
        console.error('Summary fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [token]);

  const stats = [
    { label: 'Platform Users', value: summary.totalUsers.toLocaleString(), change: '+12%', color: 'blue' },
    { label: 'Total Tokens', value: summary.totalTokens.toLocaleString(), change: '+8%', color: 'indigo' },
    { label: 'Active Keys', value: summary.activeKeys, change: 'Stable', color: 'emerald' },
    { label: 'System Uptime', value: summary.successRate, change: '+0.1%', color: 'amber' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-2">
            Welcome back, {user?.fullName || 'Admin'}!
          </h1>
          <p className="text-gray-500">Here's a live summary of your NeuraDeepAI instance.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95">
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-gray-400 mb-1">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-display font-bold text-gray-900">
                {loading ? '...' : stat.value}
              </h3>
              <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-gray-400'} mb-1.5`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">Traffic Breakdown</h3>
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
              Live Feed
            </div>
          </div>
          <div className="flex-1 bg-gray-50/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-100 p-8 text-center text-gray-400 font-medium italic">
            Visual metrics are available in the Analytics tab.
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-8 tracking-tight">Service Nodes</h3>
          <div className="space-y-6">
            {[
              { name: 'Edge Proxy', status: 'Healthy', color: 'emerald' },
              { name: 'Core DB', status: 'Degraded', color: 'amber' },
              { name: 'Auth Server', status: 'Healthy', color: 'emerald' },
              { name: 'S3 Storage', status: 'Healthy', color: 'emerald' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <span className="font-semibold text-gray-700">{s.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                  <span className={`text-[10px] font-bold ${s.color === 'emerald' ? 'text-emerald-600' : 'text-amber-600'} uppercase tracking-widest`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="callback" element={<div className="p-8 text-center glass rounded-3xl">
            <h2 className="text-2xl font-bold mb-4">Connecting to Desktop App...</h2>
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>} />
          <Route index element={<Navigate to="login" />} />
        </Route>

        <Route path="/dashboard" element={
          <AdminGuard>
            <DashboardLayout />
          </AdminGuard>
        }>
          <Route index element={<DashboardOverview />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="keys" element={<KeysPage />} />
          <Route path="models" element={<ConfigPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<div className="p-8 glass rounded-[2.5rem]">General settings module coming soon.</div>} />
        </Route>

        <Route path="/" element={<Navigate to="/auth/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
