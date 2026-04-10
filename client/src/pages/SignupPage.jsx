// f:/palama-persona-v1/neuradeepai-platform/client/src/pages/SignupPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/v1/auth/signup', { 
        email, 
        password, 
        fullName 
      });
      
      const { accessToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-10 rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-bold text-gradient mb-2">Join Us</h1>
        <p className="text-text-secondary">Create your NeuraDeepAI account</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-5 py-4 bg-[var(--surface-hover)] border border-[var(--border)] text-text-primary rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] focus:border-white outline-none transition-all placeholder:text-[rgba(255,255,255,0.2)]"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-5 py-4 bg-[var(--surface-hover)] border border-[var(--border)] text-text-primary rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] focus:border-white outline-none transition-all placeholder:text-[rgba(255,255,255,0.2)]"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2 ml-1">Password</label>
          <input
            type="password"
            required
            className="w-full px-5 py-4 bg-[var(--surface-hover)] border border-[var(--border)] text-text-primary rounded-2xl focus:ring-2 focus:ring-[rgba(255,255,255,0.2)] focus:border-white outline-none transition-all placeholder:text-[rgba(255,255,255,0.2)]"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="gradient-btn w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {loading ? 'Creating Account...' : 'Get Started'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <button onClick={() => navigate('/auth/login')} className="text-white font-bold hover:underline">
          Sign In
        </button>
      </div>
    </div>
  );
}
