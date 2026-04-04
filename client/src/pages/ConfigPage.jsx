// f:/palama-persona-v1/neuradeepai-platform/client/src/pages/ConfigPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const ConfigPage = () => {
  const { token } = useAuthStore();
  const [configs, setConfigs] = useState({
    THINKING_MODEL: '',
    VISION_MODEL: '',
    CHAT_MODEL: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('/api/v1/admin/config/admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const map = {};
        res.data.forEach(item => map[item.key] = item.value);
        setConfigs({
          THINKING_MODEL: map.THINKING_MODEL || 'groq:deepseek-r1-distill-llama-70b',
          VISION_MODEL: map.VISION_MODEL || 'qwen/qwen3-vl-235b-instruct',
          CHAT_MODEL: map.CHAT_MODEL || 'openai/gpt-4o-mini'
        });
      } catch (err) {
        console.error('Failed to load config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [token]);

  const handleUpdate = async (key, value) => {
    try {
      await axios.post('/api/v1/admin/config/admin', { key, value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Successfully updated ${key}!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) return <div className="text-white p-8">Loading models...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
      <div className="flex flex-col">
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-2">Model Orchestration</h1>
        <p className="text-gray-500">Centrally manage which AI models and providers the Palama agent uses for different tasks.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { key: 'THINKING_MODEL', label: '🧠 Thinking & Reason', desc: 'Used for task decomposition and complex logic.' },
          { key: 'VISION_MODEL', label: '👀 Computer Vision', desc: 'Used for screen analysis and element detection.' },
          { key: 'CHAT_MODEL', label: '💬 Conversation LLM', desc: 'Used for general chat and final responses.' }
        ].map((item) => (
          <div key={item.key} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-lg transition-all transform hover:-translate-y-1">
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2">{item.label}</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">{item.desc}</p>
            
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provider:Model ID</label>
              <input 
                type="text" 
                defaultValue={configs[item.key]}
                onBlur={(e) => handleUpdate(item.key, e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-sm font-medium"
                placeholder="e.g. groq:model-name"
              />
            </div>
            
            <div className="mt-8 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
              <p className="text-[10px] text-gray-400 italic">Auto-saves on blur</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 mt-8">
        <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
          <span>⚠️</span> Important Note
        </h4>
        <p className="text-amber-700 text-sm leading-relaxed">
          The Palama agent fetches these values on startup. Changes made here will take effect immediately for new agent sessions. 
          Ensure you have the corresponding API keys configured in the <strong>Keys</strong> tab.
        </p>
      </div>
    </div>
  );
};

export default ConfigPage;
