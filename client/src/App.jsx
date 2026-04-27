// f:/palama-persona-v1/neuradeepai-platform/client/src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, FileJson, FileText, Image, FileType2 } from 'lucide-react';

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
import FeedbacksPage from './pages/FeedbacksPage';
import InfrastructurePage from './pages/InfrastructurePage';

// Layout Components
const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center p-4 font-sans border-t border-[var(--border)]">
    <Outlet />
  </div>
);

const DashboardLayout = () => (
  <div className="flex h-screen bg-[var(--bg-color)] overflow-hidden">
    <Sidebar />
    <main className="flex-1 p-8 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

// Secure Admin Guard
const AdminGuard = ({ children }) => {
  const { user, token, logout } = useAuthStore();
  
  if (!token || user?.role !== 'admin') {
    // SECURITY: If they shouldn't be here, clear the session
    if (token) logout();
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

const DashboardOverview = () => {
  const { user, token } = useAuthStore();
  const [summary, setSummary] = useState({ totalUsers: 0, activeKeys: 0, totalTokens: 0, successRate: '99.9%' });
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [summaryRes, analyticsRes] = await Promise.all([
          axios.get('/api/v1/admin/summary', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/v1/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSummary(summaryRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [token]);

  const handleGenerateReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary,
      analytics
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neuradeepai-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportOther = (format) => {
    if (format === 'PDF') {
      window.print(); // The easiest way to export to PDF natively
    } else {
      alert(`Exporting to ${format} requires backend processing in this version.`);
    }
    setShowExportMenu(false);
  };

  const stats = [
    { label: 'Platform Users', value: summary.totalUsers.toLocaleString(), change: '+12%', color: 'blue' },
    { label: 'Total Tokens', value: summary.totalTokens.toLocaleString(), change: '+8%', color: 'indigo' },
    { label: 'Active Keys', value: summary.activeKeys, change: 'Stable', color: 'emerald' },
    { label: 'Avg Rating', value: summary.averageRating, change: `${summary.totalFeedbacks} reviews`, color: 'amber' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
            Welcome back, <span className="text-gradient">{user?.fullName || 'Admin'}</span>!
          </h1>
          <p className="text-text-secondary">Here's a live summary of your NeuraDeepAI instance.</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="gradient-btn px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"
          >
            <Download size={18} />
            Generate Report
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-3 w-48 surface-card p-2 shadow-2xl border border-[var(--border-highlight)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button onClick={() => handleExportOther('PDF')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left">
                <FileType2 size={16} className="text-red-400" /> Export as PDF
              </button>
              <button onClick={() => handleExportOther('Word')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left">
                <FileText size={16} className="text-blue-400" /> Export as Word
              </button>
              <button onClick={() => handleExportOther('PNG')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left">
                <Image size={16} className="text-success" /> Export as PNG
              </button>
              <div className="h-px bg-[var(--border)] my-1"></div>
              <button onClick={handleGenerateReport} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-left">
                <FileJson size={16} className="text-amber-400" /> Export Data (JSON)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="surface-card p-6 hover:border-[rgba(255,255,255,0.15)] transition-colors">
            <p className="text-sm font-semibold text-text-secondary mb-1">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-display font-bold text-white">
                {loading ? '...' : stat.value}
              </h3>
              <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-success' : 'text-text-secondary'} mb-1.5`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
        {/* Container Status Card */}
        <div className="surface-card p-6 border-l-4 border-purple-500 bg-gradient-to-br from-purple-900/10 to-transparent">
            <p className="text-sm font-semibold text-text-secondary mb-1">Container Usage</p>
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-white">{summary.activeContainers || 0}</h3>
                        <span className="text-xs text-text-muted">/ {summary.maxContainers || 5}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 transition-all duration-1000"
                            style={{ width: `${((summary.activeContainers || 0) / (summary.maxContainers || 5)) * 100}%` }}
                        ></div>
                    </div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Download size={20} className="rotate-180" />
                </div>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 surface-card p-8 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <h3 className="text-xl font-display font-bold text-white tracking-tight">Traffic Breakdown</h3>
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-text-primary bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.05)] px-3 py-1 rounded-full">
              Live Feed
            </div>
          </div>
          <div className="flex-1 bg-[rgba(0,0,0,0.2)] rounded-2xl flex items-center justify-center border border-[rgba(255,255,255,0.05)] p-4 text-center overflow-hidden">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="colorTokensPreview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTokensPreview)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-text-secondary font-medium italic animate-pulse">Loading live flow...</div>
            )}
          </div>
        </div>

        <div className="surface-card p-8">
          <h3 className="text-xl font-display font-bold text-white mb-8 tracking-tight">Service Nodes</h3>
          <div className="space-y-6">
            {[
              { name: 'Palama Orchestrator', status: summary.activeContainers !== undefined ? 'Healthy' : 'Disconnected', color: summary.activeContainers !== undefined ? 'emerald' : 'rose' },
              { name: 'Edge Proxy', status: 'Healthy', color: 'emerald' },
              { name: 'Core DB', status: 'Healthy', color: 'emerald' },
              { name: 'Auth Server', status: 'Healthy', color: 'emerald' },
              { name: 'S3 Storage', status: 'Healthy', color: 'emerald' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center pb-4 border-b border-[rgba(255,255,255,0.05)] last:border-0 last:pb-0">
                <span className="font-semibold text-text-secondary">{s.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.color === 'emerald' ? 'bg-success' : 'bg-danger'} animate-pulse`}></span>
                  <span className={`text-[10px] font-bold ${s.color === 'emerald' ? 'text-success' : 'text-danger'} uppercase tracking-widest`}>
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
  const { logout } = useAuthStore();

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Session expired or unauthorized. Logging out...');
          logout();
          // Force a full page reload to the login page to clear any stale state
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

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
          <Route path="infrastructure" element={<InfrastructurePage />} />
          <Route path="feedbacks" element={<FeedbacksPage />} />
          <Route path="settings" element={<div className="p-8 glass rounded-[2.5rem]">General settings module coming soon.</div>} />
        </Route>

        <Route path="/" element={<Navigate to="/auth/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
