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
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-2">Platform Analytics</h1>
          <p className="text-gray-500">Deep dive into token consumption and system performance.</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className={`p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-brand-600 mb-4">
            <Activity size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Consumption</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-gray-900">{totalTokens.toLocaleString()}</h3>
          <p className="text-xs text-emerald-500 font-bold mt-1">Last 30 days</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-indigo-600 mb-4">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Daily Average</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-gray-900">{avgTokens.toLocaleString()}</h3>
          <p className="text-xs text-gray-400 font-medium mt-1">Tokens per day</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <PieChart size={20} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Peak Load</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-gray-900">{maxTokens.toLocaleString()}</h3>
          <p className="text-xs text-rose-500 font-bold mt-1">Single day high</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Cumulative Trend - Line Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-brand-600" />
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
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
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-8">Daily Token Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
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
