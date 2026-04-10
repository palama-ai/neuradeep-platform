// f:/palama-persona-v1/neuradeepai-platform/client/src/pages/UsersPage.jsx

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, MoreVertical, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const { token } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await axios.put(`/api/v1/admin/users/${id}`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesEmail = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter ? user.plan === planFilter : true;
    return matchesEmail && matchesPlan;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">User Management</h1>
          <p className="text-text-secondary">Manage, audit and control platform access for all users.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className={`p-3 rounded-xl border border-[var(--border)] hover:bg-[rgba(255,255,255,0.05)] transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} className="text-text-secondary" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search by email..."
            className="w-full pl-12 pr-4 py-3 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] focus:border-white outline-none transition-all text-white placeholder:text-[rgba(255,255,255,0.2)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <select
            className="pl-12 pr-8 py-3 bg-[var(--surface-hover)] border border-[var(--border)] rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] outline-none appearance-none cursor-pointer text-white font-medium"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)]">
                <th className="px-8 py-5 text-xs font-bold text-text-secondary uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-xs font-bold text-text-secondary uppercase tracking-widest">Plan</th>
                <th className="px-8 py-5 text-xs font-bold text-text-secondary uppercase tracking-widest">Usage</th>
                <th className="px-8 py-5 text-xs font-bold text-text-secondary uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.1)] border border-[var(--border)] flex items-center justify-center text-white font-bold text-sm">
                        {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white">{user.fullName || 'Unnamed'}</div>
                        <div className="text-sm text-text-secondary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      user.plan === 'enterprise' ? 'bg-[rgba(99,102,241,0.2)] text-indigo-400 border border-[rgba(99,102,241,0.3)]' :
                      user.plan === 'pro' ? 'bg-[rgba(16,185,129,0.2)] text-success border border-[rgba(16,185,129,0.3)]' :
                      'bg-[rgba(255,255,255,0.05)] text-text-secondary border border-[var(--border)]'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{user.tokensUsedTotal} tokens</span>
                      <div className="w-24 h-1.5 bg-[var(--surface-hover)] rounded-full mt-1.5 overflow-hidden border border-[var(--border)]">
                        <div className="bg-white h-full rounded-full opacity-50" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-rose-500" />
                          <span className="text-sm font-semibold text-rose-600">Suspended</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      className="p-2 hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors text-text-secondary hover:text-white"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center text-text-secondary">
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
