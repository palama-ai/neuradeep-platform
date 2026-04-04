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
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Join Us</h1>
        <p className="text-gray-500">Create your NeuraDeepAI account</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-5 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

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
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-brand-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {loading ? 'Creating Account...' : 'Get Started'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button onClick={() => navigate('/auth/login')} className="text-brand-600 font-bold hover:underline">
          Sign In
        </button>
      </div>
    </div>
  );
}
