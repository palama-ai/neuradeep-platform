// f:/palama-persona-v1/neuradeepai-platform/client/src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const callback = searchParams.get('callback');
      const url = callback ? `/api/v1/auth/login?callback=${encodeURIComponent(callback)}` : '/api/v1/auth/login';
      
      const response = await axios.post(url, { email, password });
      
      const { accessToken, redirectUrl, user } = response.data;
      
      // Store token and user in global store
      setAuth(user, accessToken);

      // Handle redirect
      if (redirectUrl) {
          window.location.href = redirectUrl;
      } else {
          navigate('/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-10 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-500">Sign in to your NeuraDeepAI account</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Password</label>
          <input
            type="password"
            required
            className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-brand-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button onClick={() => navigate('/auth/signup')} className="text-brand-600 font-bold hover:underline">
          Create one now
        </button>
      </div>
    </div>
  );
}
