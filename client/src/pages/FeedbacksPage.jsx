import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar, Search, Filter, ArrowUpDown } from 'lucide-react';
import axios from 'axios';

const FeedbacksPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ total: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feedbacksRes, summaryRes] = await Promise.all([
        axios.get('/api/v1/admin/feedbacks'),
        axios.get('/api/v1/admin/summary')
      ]);
      setFeedbacks(feedbacksRes.data);
      setStats({
        total: summaryRes.data.totalFeedbacks,
        average: summaryRes.data.averageRating
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch feedbacks', err);
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => 
    f.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStarColor = (rating) => {
    if (rating >= 4) return 'text-yellow-400';
    if (rating >= 3) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">User Feedbacks</h1>
          <p className="text-text-secondary">Analyze user sentiment and quality of service.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-surface p-4 rounded-2xl border border-[var(--border)] min-w-[140px]">
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Avg. Rating</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{stats.average}</span>
              <Star className="text-yellow-400 fill-yellow-400" size={18} />
            </div>
          </div>
          <div className="bg-surface p-4 rounded-2xl border border-[var(--border)] min-w-[140px]">
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Total Reviews</p>
            <span className="text-2xl font-bold text-white">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface rounded-2xl border border-[var(--border)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search by user or comment content..."
            className="w-full bg-[rgba(255,255,255,0.03)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Feedbacks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((fb) => (
            <div key={fb.id} className="bg-surface rounded-2xl border border-[var(--border)] p-6 hover:border-[rgba(255,255,255,0.2)] transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-white font-bold border border-[var(--border)] group-hover:bg-white group-hover:text-black transition-colors">
                    {fb.user?.fullName?.charAt(0) || fb.user?.email?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[150px]">
                      {fb.user?.fullName || 'Anonymous'}
                    </h4>
                    <p className="text-xs text-text-secondary truncate max-w-[150px]">{fb.user?.email}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(0,0,0,0.3)] border border-[var(--border)] font-bold text-sm ${getStarColor(fb.rating)}`}>
                  {fb.rating} <Star size={14} fill="currentColor" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative p-4 rounded-xl bg-[rgba(255,255,255,0.02)] min-h-[80px]">
                  <MessageSquare className="absolute -top-2 -left-2 text-text-secondary opacity-20" size={24} />
                  <p className="text-sm text-text-secondary line-clamp-4 italic">
                    "{fb.comment || 'No comment provided.'}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                  <span>ID: {fb.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <MessageSquare className="mx-auto text-text-secondary mb-4 opacity-20" size={48} />
            <h3 className="text-xl font-bold text-white">No feedbacks found</h3>
            <p className="text-text-secondary">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbacksPage;
