import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  BarChart3, 
  Layers, 
  Link as LinkIcon, 
  Loader2, 
  AlertCircle,
  Instagram,
  ArrowRight,
  Key
} from 'lucide-react';

import Navbar from './components/Navbar';
import ProfileHeader from './components/ProfileHeader';
import AnalyticsTab from './components/AnalyticsTab';
import MediaGridTab from './components/MediaGridTab';
import SingleDownloaderTab from './components/SingleDownloaderTab';
import DownloadModal from './components/DownloadModal';
import SessionModal from './components/SessionModal';

export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'media' | 'single'

  // Data state
  const [profileData, setProfileData] = useState(null);
  const [postsData, setPostsData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Modals state
  const [activeJobId, setActiveJobId] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Handle Search Profile
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: searchInput.trim() })
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(text || 'Server returned an invalid response.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Could not fetch profile information.');
      }

      setProfileData(data.profile);
      setPostsData(data.posts || []);
      setAnalyticsData(data.analytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Bulk Download
  const handleTriggerBulkDownload = async (selectedShortcodes = null) => {
    if (!profileData) return;

    try {
      const res = await fetch('/api/download/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileData.username,
          selected_shortcodes: selectedShortcodes,
          download_profile_pic: true,
          export_metadata: true,
        })
      });

      const data = await res.json();
      if (data.success && data.job_id) {
        setActiveJobId(data.job_id);
      }
    } catch (err) {
      alert(`Bulk download start failed: ${err.message}`);
    }
  };

  // Trigger Single Media Download
  const handleDownloadSingle = async (post) => {
    if (!profileData) {
      const targetUrl = post.video_url || post.display_url;
      const a = document.createElement('a');
      a.href = `/api/media/proxy?url=${encodeURIComponent(targetUrl)}`;
      a.download = `${post.shortcode}_media.${post.media_type === 'reel' || post.video_url ? 'mp4' : 'jpg'}`;
      a.click();
      return;
    }

    handleTriggerBulkDownload([post.shortcode]);
  };

  // Open Downloads Folder in Mac Finder
  const handleOpenFolder = async (username = '') => {
    try {
      await fetch('/api/system/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Export Analytics CSV
  const handleExportCSV = () => {
    if (!postsData || postsData.length === 0) return;

    const headers = ["Shortcode,Type,Date,Likes,Comments,Views,ER%,URL,Caption\n"];
    const rows = postsData.map(p => {
      const cleanCaption = `"${(p.caption || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      return `${p.shortcode},${p.media_type},${p.date_str},${p.likes_count},${p.comments_count},${p.video_views_count || 0},${p.engagement_rate},${p.url},${cleanCaption}\n`;
    });

    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profileData?.username || 'instagram'}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        onOpenSessionModal={() => setIsSessionModalOpen(true)}
        onOpenDownloadsFolder={() => handleOpenFolder(profileData?.username)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Profile Search Bar */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Decode Any Creator. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 bg-clip-text text-transparent">
              Download Media in 1-Click.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            Instant growth analytics, viral post breakdown, best posting times, and full HD batch downloading for any Instagram profile.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20 transition">
            <div className="flex items-center pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter username (e.g. cristiano, zuck) or profile URL..."
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none px-2 py-2"
            />
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-pink-500/25 transition active:scale-95 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left animate-fadeIn space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Notice</span>
              </div>
              <p className="leading-relaxed">{error}</p>
              {error.includes('IG Session') && (
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Open IG Session Settings</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex justify-center border-b border-slate-800 pb-4">
          <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Growth Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'media'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Media & Bulk Downloader {postsData?.length > 0 ? `(${postsData.length})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'single'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Single Link Downloader</span>
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        {profileData && activeTab !== 'single' && (
          <ProfileHeader
            profile={profileData}
            analytics={analyticsData}
            onTriggerBulkDownload={() => handleTriggerBulkDownload()}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* Dynamic Tab Content */}
        {activeTab === 'analytics' && (
          profileData ? (
            <AnalyticsTab
              profile={profileData}
              analytics={analyticsData}
              posts={postsData}
              onDownloadSingle={handleDownloadSingle}
            />
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 border border-pink-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Profile Analyzed Yet</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Search for any Instagram username or profile link above to see performance statistics, viral content rankings, and engagement benchmarks.
              </p>
            </div>
          )
        )}

        {activeTab === 'media' && (
          profileData ? (
            <MediaGridTab
              posts={postsData}
              onTriggerBulkDownload={handleTriggerBulkDownload}
              onDownloadSingle={handleDownloadSingle}
            />
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 border border-pink-500/20">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Media Library Waiting</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Search a creator username above to view, filter, and batch download all their photos, carousels, and reels.
              </p>
            </div>
          )
        )}

        {activeTab === 'single' && (
          <SingleDownloaderTab onDownloadSingle={handleDownloadSingle} />
        )}
      </main>

      {/* Download Progress Modal */}
      {activeJobId && (
        <DownloadModal
          jobId={activeJobId}
          username={profileData?.username || 'instagram'}
          onClose={() => setActiveJobId(null)}
          onOpenFolder={handleOpenFolder}
        />
      )}

      {/* Session ID Configuration Modal */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>Instagram Growth Intelligence & Media Downloader • Designed for Creators & Growth Strategists</p>
      </footer>
    </div>
  );
}
