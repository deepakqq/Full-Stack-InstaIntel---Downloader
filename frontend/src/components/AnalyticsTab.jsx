import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Hash, 
  Sparkles, 
  Award, 
  Download, 
  Layers,
  CheckCircle2
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsTab({ profile, analytics, posts, onDownloadSingle }) {
  if (!analytics) return null;

  // 1. Day of Week Chart Data
  const dayLabels = analytics.best_posting_days?.map(d => d.day) || [];
  const dayLikes = analytics.best_posting_days?.map(d => d.avg_likes) || [];
  const dayPostsCount = analytics.best_posting_days?.map(d => d.posts_count) || [];

  const dayChartData = {
    labels: dayLabels,
    datasets: [
      {
        label: 'Avg Likes per Post',
        data: dayLikes,
        backgroundColor: 'rgba(244, 63, 94, 0.7)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f43f5e',
      }
    ],
  };

  // 2. 24-Hour Posting Time Chart Data
  const hourLabels = (analytics.best_posting_hours || []).map(h => `${h.hour}:00`);
  const hourLikes = (analytics.best_posting_hours || []).map(h => h.avg_likes);

  const hourChartData = {
    labels: hourLabels,
    datasets: [
      {
        label: 'Avg Engagement by Hour (UTC)',
        data: hourLikes,
        fill: true,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        tension: 0.4,
        pointBackgroundColor: '#c084fc',
      }
    ]
  };

  // 3. Content Mix Doughnut Data
  const contentKeys = Object.keys(analytics.content_distribution || {});
  const contentValues = Object.values(analytics.content_distribution || {});
  const doughnutColors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const contentChartData = {
    labels: contentKeys.map(k => k.toUpperCase()),
    datasets: [
      {
        data: contentValues,
        backgroundColor: doughnutColors.slice(0, contentKeys.length),
        borderWidth: 2,
        borderColor: '#0f172a',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11, family: 'Plus Jakarta Sans' } }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Engagement Rate Card */}
        <div className="glass-panel p-5 rounded-2xl border border-pink-500/20 glow-card transition relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engagement Rate</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{analytics.engagement_rate}%</span>
            <span className="text-xs font-medium text-pink-400">ER Rate</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Benchmark: <span className="text-white font-semibold">{analytics.engagement_rating}</span>
          </p>
        </div>

        {/* Avg Likes Card */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 glow-card transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Likes / Post</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{(analytics.avg_likes || 0).toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Across {analytics.posts_analyzed} analyzed posts
          </p>
        </div>

        {/* Avg Comments Card */}
        <div className="glass-panel p-5 rounded-2xl border border-blue-500/20 glow-card transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Comments</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{(analytics.avg_comments || 0).toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Community conversation score
          </p>
        </div>

        {/* Posting Frequency Card */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 glow-card transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Posting Cadence</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">~{analytics.estimated_weekly_frequency}</span>
            <span className="text-xs font-medium text-slate-400">posts/week</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Follower/Following Ratio: <span className="text-white font-semibold">{analytics.follower_to_following_ratio}x</span>
          </p>
        </div>
      </div>

      {/* Actionable Creator Growth Recommendations */}
      {analytics.growth_tips && analytics.growth_tips.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-pink-500/5 to-transparent">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Creator Growth Playbook & Strategic Takeaways</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analytics.growth_tips.map((tip, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span dangerouslySetInnerHTML={{ __html: tip.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Day of Week */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Day of Week Performance</h3>
              <p className="text-xs text-slate-400">Average likes generated on each weekday</p>
            </div>
            <Calendar className="w-5 h-5 text-rose-400" />
          </div>
          <div className="h-64">
            <Bar data={dayChartData} options={chartOptions} />
          </div>
        </div>

        {/* Content Type Mix */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Content Mix</h3>
              <p className="text-xs text-slate-400">Reels vs Photos vs Carousels</p>
            </div>
            <Layers className="w-5 h-5 text-sky-400" />
          </div>
          <div className="h-52 flex items-center justify-center">
            {contentValues.length > 0 ? (
              <Doughnut 
                data={contentChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
                  }
                }} 
              />
            ) : (
              <p className="text-xs text-slate-500">No media distribution data</p>
            )}
          </div>
          {/* Percentage Pills */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {Object.entries(analytics.content_percentage || {}).map(([type, pct]) => (
              <span key={type} className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                {type.toUpperCase()}: <span className="font-bold text-white">{pct}%</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 24-Hour Posting Schedule Curve */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base">24-Hour Best Posting Window (UTC)</h3>
            <p className="text-xs text-slate-400">Engagement distribution across hours of the day</p>
          </div>
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
        <div className="h-60">
          <Line data={hourChartData} options={chartOptions} />
        </div>
      </div>

      {/* Top 10 Viral / Best Performing Posts */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-lg">Top Performing & Viral Posts</h3>
              <p className="text-xs text-slate-400">Highest engagement content to take inspiration from</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(analytics.top_posts || []).slice(0, 10).map((post, idx) => {
            const thumb = post.display_url 
              ? `/api/media/proxy?url=${encodeURIComponent(post.display_url)}`
              : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80';

            return (
              <div key={post.id || idx} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-pink-500/40 transition flex flex-col">
                {/* Ranking Badge */}
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-500/30">
                  #{idx + 1}
                </div>

                {/* Media Type Badge */}
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-semibold text-slate-300 uppercase">
                  {post.media_type}
                </div>

                {/* Thumbnail */}
                <div className="relative aspect-square overflow-hidden bg-slate-950">
                  <img
                    src={thumb}
                    alt={post.shortcode}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3 justify-between">
                    <button
                      onClick={() => onDownloadSingle(post)}
                      className="p-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white shadow-lg transition"
                      title="Download this post"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-400 hover:underline"
                    >
                      View on IG ↗
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center space-x-1 text-rose-400 font-semibold">
                      <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                      <span>{post.likes_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-400 font-semibold">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.comments_count.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                    "{post.caption || 'No caption'}"
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">
                    {post.date_str ? post.date_str.split(' ')[0] : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Hashtags Cloud & Metrics Table */}
      {analytics.top_hashtags && analytics.top_hashtags.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <Hash className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-lg">Top Hashtags & Content Keywords</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {analytics.top_hashtags.map((h, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition">
                <p className="font-bold text-emerald-400 text-xs truncate mb-1">{h.tag}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Used: <strong className="text-white">{h.count}x</strong></span>
                  <span>Avg Likes: <strong className="text-white">{h.avg_likes.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
