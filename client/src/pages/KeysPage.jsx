// f:/palama-persona-v1/neuradeepai-platform/client/src/pages/KeysPage.jsx

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, ShieldCheck, AlertCircle, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const KeysPage = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({ provider: 'openrouter', apiKey: '', monthlyBudget: 100 });
  const { token } = useAuthStore();

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/admin/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeys(response.data);
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [token]);

  const handleAddKey = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/admin/keys', newKey, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddForm(false);
      setNewKey({ provider: 'openrouter', apiKey: '', monthlyBudget: 100 });
      fetchKeys();
    } catch (err) {
      console.error('Failed to add key:', err);
    }
  };

  const deleteKey = async (id) => {
    if (!window.confirm('Are you sure you want to remove this key?')) return;
    try {
      await axios.delete(`/api/v1/admin/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchKeys();
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-2">API Provider Keys</h1>
          <p className="text-gray-500">Securely manage your high-level LLM credentials and budgets.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95"
        >
          {showAddForm ? 'View Keys' : <><Plus size={18} /> Add New Key</>}
        </button>
      </div>

      {showAddForm ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
          <form onSubmit={handleAddKey} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Provider</label>
                <select 
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 outline-none transition-all font-medium"
                  value={newKey.provider}
                  onChange={e => setNewKey({...newKey, provider: e.target.value})}
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="groq">Groq</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 outline-none transition-all"
                  value={newKey.monthlyBudget}
                  onChange={e => setNewKey({...newKey, monthlyBudget: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Secret API Key</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="sk-or-v1-..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 outline-none transition-all"
                  value={newKey.apiKey}
                  onChange={e => setNewKey({...newKey, apiKey: e.target.value})}
                />
              </div>
              <p className="mt-4 text-xs text-amber-600 flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100">
                <ShieldCheck size={14} />
                This key will be encrypted using AES-256 before storage.
              </p>
            </div>
            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl">
              Save Secure Credential
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-brand-600" /></div>
          ) : keys.map((key) => (
            <div key={key.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${
                  key.provider === 'openrouter' ? 'bg-blue-50 text-blue-600' :
                  key.provider === 'groq' ? 'bg-indigo-50 text-indigo-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <Zap size={24} fill="currentColor" />
                </div>
                <button 
                  onClick={() => deleteKey(key.id)}
                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-xl font-display font-bold text-gray-900 capitalize mb-1">{key.provider}</h3>
              <p className="text-xs font-mono text-gray-400 mb-6">{key.apiKeyMasked}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Monthly Spend</span>
                  <span className="font-bold text-gray-900">${Number(key.currentSpend).toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${key.currentSpend > key.monthlyBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min((Number(key.currentSpend) / Number(key.monthlyBudget)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <span>Usage: {((Number(key.currentSpend) / Number(key.monthlyBudget)) * 100).toFixed(1)}%</span>
                  <span>Limit: ${Number(key.monthlyBudget)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
                <span className={`flex items-center gap-1 text-xs font-bold ${key.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {key.isActive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {key.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium italic">SSL Encrypted</span>
              </div>
            </div>
          ))}
          {keys.length === 0 && !loading && (
            <div className="col-span-full bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-20 text-center">
              <Key size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No API keys found. Add one to start the proxy service.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KeysPage;
