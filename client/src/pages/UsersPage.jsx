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
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-2">User Management</h1>
          <p className="text-gray-500">Manage, audit and control platform access for all users.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className={`p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by email..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            className="pl-12 pr-8 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-100 shadow-sm outline-none appearance-none cursor-pointer text-gray-600 font-medium"
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

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Usage</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm">
                        {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{user.fullName || 'Unnamed'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      user.plan === 'enterprise' ? 'bg-indigo-50 text-indigo-600' :
                      user.plan === 'pro' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">{user.tokensUsedTotal} tokens</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-brand-500 h-full rounded-full" style={{ width: '45%' }}></div>
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
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center text-gray-400">
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
