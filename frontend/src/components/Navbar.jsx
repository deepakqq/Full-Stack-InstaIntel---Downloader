import React from 'react';
import { Instagram, FolderOpen, Key, Sparkles, Download } from 'lucide-react';

export default function Navbar({ onOpenSessionModal, onOpenDownloadsFolder }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F17]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] flex items-center justify-center shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <Instagram className="w-5 h-5 text-pink-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                InstaIntel & Downloader
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Creator Intelligence, Analytics & Bulk Media Downloader
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenDownloadsFolder}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
            title="Open local downloads directory in Finder"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Open Downloads</span>
          </button>

          <button
            onClick={onOpenSessionModal}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
            title="Configure Instagram Session Cookie"
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">IG Session</span>
          </button>
        </div>
      </div>
    </header>
  );
}
