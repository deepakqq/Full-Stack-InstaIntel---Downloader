import React from 'react';
import { 
  BadgeCheck, 
  ExternalLink, 
  Users, 
  UserCheck, 
  Grid, 
  Download, 
  FileSpreadsheet, 
  Flame, 
  Sparkles,
  Lock
} from 'lucide-react';

export default function ProfileHeader({ profile, analytics, onTriggerBulkDownload, onExportCSV }) {
  if (!profile) return null;

  const profilePic = profile.profile_pic_url 
    ? `/api/media/proxy?url=${encodeURIComponent(profile.profile_pic_url_hd || profile.profile_pic_url)}`
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 relative overflow-hidden shadow-xl border border-slate-800">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
        {/* Profile Avatar with HD download capability */}
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-xl shadow-pink-500/10">
            <img
              src={profilePic}
              alt={profile.username}
              className="w-full h-full object-cover rounded-full bg-slate-900 border-2 border-slate-900"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <a
            href={profilePic}
            download={`${profile.username}_avatar_hd.jpg`}
            className="absolute bottom-0 right-0 p-1.5 bg-slate-900/90 text-pink-400 rounded-full border border-slate-700 shadow hover:bg-pink-600 hover:text-white transition"
            title="Download HD Profile Picture"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Profile Info Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">@{profile.username}</h1>
            {profile.is_verified && (
              <BadgeCheck className="w-5 h-5 text-sky-400 fill-sky-400/20" title="Verified Account" />
            )}
            {profile.is_private && (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </span>
            )}
            {profile.business_category_name && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {profile.business_category_name}
              </span>
            )}
            {analytics?.engagement_rating && (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Flame className="w-3 h-3" />
                <span>{analytics.engagement_rating}</span>
              </span>
            )}
          </div>

          {profile.full_name && (
            <p className="text-slate-300 font-semibold text-sm mb-1">{profile.full_name}</p>
          )}

          {profile.biography && (
            <p className="text-slate-400 text-xs sm:text-sm whitespace-pre-line mb-3 max-w-2xl leading-relaxed">
              {profile.biography}
            </p>
          )}

          {profile.external_url && (
            <a
              href={profile.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 transition mb-3 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{profile.external_url}</span>
            </a>
          )}

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t border-slate-800/80">
            <div className="flex items-center space-x-2">
              <Grid className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-white">{(profile.posts_count || 0).toLocaleString()}</span>
              <span className="text-xs text-slate-400">Posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-white">{(profile.followers_count || 0).toLocaleString()}</span>
              <span className="text-xs text-slate-400">Followers</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-white">{(profile.following_count || 0).toLocaleString()}</span>
              <span className="text-xs text-slate-400">Following</span>
            </div>
            {analytics && (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{analytics.engagement_rate}%</span>
                <span className="text-xs text-slate-400">ER Rate</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
          <button
            onClick={() => onTriggerBulkDownload()}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download All Media</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Analytics CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
