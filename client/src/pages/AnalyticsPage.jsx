// f:/palama-persona-v1/neuradeepai-platform/client/src/pages/AnalyticsPage.jsx

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Activity, PieChart, Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const AnalyticsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  // Derived stats
  const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);
  const avgTokens = data.length ? (totalTokens / data.length).toFixed(0) : 0;
  const maxTokens = data.length ? Math.max(...data.map(d => d.tokens)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">Platform Analytics</h1>
          <p className="text-text-secondary">Deep dive into token consumption and system performance.</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className={`p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} className="text-text-secondary" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="surface-card p-6">
          <div className="flex items-center gap-3 text-blue-400 mb-4">
            <Activity size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Total Consumption</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-white">{totalTokens.toLocaleString()}</h3>
          <p className="text-xs text-success font-bold mt-1">Last 30 days</p>
        </div>
        <div className="surface-card p-6">
          <div className="flex items-center gap-3 text-indigo-400 mb-4">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Daily Average</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-white">{avgTokens.toLocaleString()}</h3>
          <p className="text-xs text-text-secondary font-medium mt-1">Tokens per day</p>
        </div>
        <div className="surface-card p-6">
          <div className="flex items-center gap-3 text-amber-500 mb-4">
            <PieChart size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Peak Load</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-white">{maxTokens.toLocaleString()}</h3>
          <p className="text-xs text-red-500 font-bold mt-1">Single day high</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Cumulative Trend - Line Chart */}
        <div className="surface-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Calendar size={20} className="text-blue-400" />
              Cumulative Usage Trend
            </h3>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3d3e41" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#4F46E5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTokens)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Breakdown - Bar Chart */}
        <div className="surface-card p-8">
          <h3 className="text-xl font-display font-bold text-white mb-8">Daily Token Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3d3e41" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                />
                <Tooltip 
                  cursor={{fill: 'var(--surface-hover)'}}
                  contentStyle={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                />
                <Bar 
                  dataKey="tokens" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
