import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, Cpu, HardDrive, Activity, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ResourceCard = ({ title, value, subValue, percent, icon: Icon, color }) => (
  <div className="surface-card p-6 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400`}>
        <Icon size={24} />
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-text-secondary">{title}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        {subValue && <p className="text-xs text-text-muted">{subValue}</p>}
      </div>
    </div>
    
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div 
        className={`h-full bg-${color}-500 transition-all duration-1000`}
        style={{ width: `${percent}%` }}
      ></div>
    </div>
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
      <span>Usage</span>
      <span className={`text-${color}-400`}>{percent}%</span>
    </div>
  </div>
);

const InfrastructurePage = () => {
  const { token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get('/api/v1/admin/system-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary animate-pulse font-medium">Connecting to Oracle Infrastructure...</p>
        </div>
      </div>
    );
  }

  const { host, containers } = stats || { host: {}, containers: [] };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">Infrastructure <span className="text-gradient">Monitor</span></h1>
          <p className="text-text-secondary">Live resource usage from Oracle Cloud VM and Docker containers.</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={refreshing}
          className="p-3 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] text-white hover:border-purple-500 transition-all disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Host Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResourceCard 
          title="Host CPU" 
          value={`${host.cpuPercent}%`} 
          subValue="Intel(R) Xeon(R) @ 2.80GHz"
          percent={host.cpuPercent} 
          icon={Cpu} 
          color="blue" 
        />
        <ResourceCard 
          title="Host Memory" 
          value={`${host.memoryUsedGb} GB`} 
          subValue={`of ${host.memoryTotalGb} GB total`}
          percent={host.memoryPercent} 
          icon={Activity} 
          color="purple" 
        />
        <ResourceCard 
          title="Disk Storage" 
          value={`${100 - host.diskUsedPercent}%`} 
          subValue={`${host.diskFreeGb} GB Free`}
          percent={host.diskUsedPercent} 
          icon={HardDrive} 
          color="emerald" 
        />
      </div>

      {/* Containers Stats */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <Layers size={20} className="text-purple-400" />
            <h3 className="text-lg font-bold text-white">Active Containers</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider">
            {containers.length} Running
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-text-muted font-bold">
                <th className="px-6 py-4">User / Container</th>
                <th className="px-6 py-4">CPU Usage</th>
                <th className="px-6 py-4">Memory Usage</th>
                <th className="px-6 py-4">Time Left</th>
                <th className="px-6 py-4">Network (RX/TX)</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {containers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-secondary italic">
                    No active containers found. Orchestrator is idle.
                  </td>
                </tr>
              ) : (
                containers.map((c, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{c.userEmail}</span>
                        <span className="text-[10px] text-text-muted font-mono">{c.containerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-[60px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, c.cpuPercent)}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-white">{c.cpuPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-text-muted">{c.memoryUsageMb} MB</span>
                          <span className="text-text-muted">{c.memoryPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${c.memoryPercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${c.remainingMinutes < 5 ? 'bg-amber-500' : 'bg-success'}`}></div>
                          <span className={`text-sm font-bold ${c.remainingMinutes < 5 ? 'text-amber-400' : 'text-white'}`}>
                            {c.remainingMinutes} min
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted">Expires in {c.remainingMinutes}m</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                        <div className="flex items-center gap-1">
                          <span className="text-success">↓</span> {c.networkRxMb} MB
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-blue-400">↑</span> {c.networkTxMb} MB
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        <span className="text-[10px] font-bold text-success uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="surface-card p-6 border-l-4 border-blue-500 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <Server size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1">Oracle Cloud VM</h4>
            <p className="text-sm text-text-secondary">Host environment is running on Oracle Linux 8 (Free Tier A1). All containers share the ARM-based Ampere resources.</p>
          </div>
        </div>
        <div className="surface-card p-6 border-l-4 border-purple-500 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold mb-1">Resource Isolation</h4>
            <p className="text-sm text-text-secondary">Each container is strictly limited to 0.7 CPU and 4GB RAM to prevent resource starvation and ensure system stability.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructurePage;
