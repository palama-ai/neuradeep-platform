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
      const response = await axios.get('/api/v1/admin/keys');
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
      await axios.post('/api/v1/admin/keys', newKey);
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
      await axios.delete(`/api/v1/admin/keys/${id}`);
      fetchKeys();
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">API Provider Keys</h1>
          <p className="text-text-secondary">Securely manage your high-level LLM credentials and budgets.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          {showAddForm ? 'View Keys' : <><Plus size={18} /> Add New Key</>}
        </button>
      </div>

      {showAddForm ? (
        <div className="surface-card p-8 max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
          <form onSubmit={handleAddKey} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Provider</label>
                <select 
                  className="w-full px-5 py-4 bg-[var(--surface-hover)] border border-[var(--border)] text-white rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] focus:border-white outline-none transition-all font-medium"
                  value={newKey.provider}
                  onChange={e => setNewKey({...newKey, provider: e.target.value})}
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="groq">Groq</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="deepgram">Deepgram (Voice)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Monthly Budget ($)</label>
                <input
                  type="number"
                  className="w-full px-5 py-4 bg-[var(--surface-hover)] border border-[var(--border)] text-white rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] focus:border-white outline-none transition-all"
                  value={newKey.monthlyBudget}
                  onChange={e => setNewKey({...newKey, monthlyBudget: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Secret API Key</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="password"
                  required
                  placeholder="sk-or-v1-..."
                  className="w-full pl-12 pr-4 py-4 bg-[var(--surface-hover)] border border-[var(--border)] text-white rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] focus:border-white outline-none transition-all placeholder:text-[rgba(255,255,255,0.2)]"
                  value={newKey.apiKey}
                  onChange={e => setNewKey({...newKey, apiKey: e.target.value})}
                />
              </div>
              <p className="mt-4 text-xs text-amber-500 flex items-center gap-2 bg-[rgba(245,158,11,0.1)] p-3 rounded-xl border border-[rgba(245,158,11,0.2)]">
                <ShieldCheck size={14} />
                This key will be encrypted using AES-256 before storage.
              </p>
            </div>
            <button className="gradient-btn w-full py-4 rounded-2xl font-bold text-lg shadow-xl">
              Save Secure Credential
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center"><RefreshCw className="animate-spin text-text-secondary" /></div>
          ) : keys.map((key) => (
            <div key={key.id} className="surface-card p-6 hover:border-[rgba(255,255,255,0.15)] transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${
                  key.provider === 'openrouter' ? 'bg-[rgba(59,130,246,0.1)] text-blue-400 border border-[rgba(59,130,246,0.2)]' :
                  key.provider === 'groq' ? 'bg-[rgba(99,102,241,0.1)] text-indigo-400 border border-[rgba(99,102,241,0.2)]' :
                  key.provider === 'deepgram' ? 'bg-[rgba(236,72,153,0.1)] text-pink-400 border border-[rgba(236,72,153,0.2)]' :
                  'bg-[rgba(245,158,11,0.1)] text-amber-500 border border-[rgba(245,158,11,0.2)]'
                }`}>
                  <Zap size={24} fill="currentColor" />
                </div>
                <button 
                  onClick={() => deleteKey(key.id)}
                  className="p-2 text-text-secondary hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-xl font-display font-bold text-white capitalize mb-1">{key.provider}</h3>
              <p className="text-xs font-mono text-text-secondary mb-6">{key.apiKeyMasked}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-medium">Monthly Spend</span>
                  <span className="font-bold text-white">${Number(key.currentSpend).toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div 
                    className={`h-full rounded-full ${key.currentSpend > key.monthlyBudget ? 'bg-red-500' : 'bg-success'}`}
                    style={{ width: `${Math.min((Number(key.currentSpend) / Number(key.monthlyBudget)) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-text-secondary">
                  <span>Usage: {((Number(key.currentSpend) / Number(key.monthlyBudget)) * 100).toFixed(1)}%</span>
                  <span>Limit: ${Number(key.monthlyBudget)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--border)] flex justify-between items-center">
                <span className={`flex items-center gap-1 text-xs font-bold ${key.isActive ? 'text-success' : 'text-red-400'}`}>
                  {key.isActive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {key.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                </span>
                <span className="text-[10px] text-text-secondary font-medium italic">SSL Encrypted</span>
              </div>
            </div>
          ))}
          {keys.length === 0 && !loading && (
            <div className="col-span-full bg-[rgba(255,255,255,0.02)] border-2 border-dashed border-[var(--border)] rounded-[2.5rem] p-20 text-center">
              <Key size={48} className="mx-auto text-text-secondary mb-4 opacity-50" />
              <p className="text-text-secondary font-medium">No API keys found. Add one to start the proxy service.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KeysPage;
