import React, { useEffect, useState } from 'react';
import { 
  Download, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Sparkles,
  FileArchive
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DownloadModal({ jobId, username, onClose, onOpenFolder }) {
  const [progress, setProgress] = useState({
    status: 'in_progress',
    total_files: 1,
    downloaded_files: 0,
    percent: 0,
    current_file: 'Initializing downloader...'
  });
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/download/status/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data);

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            if (data.status === 'completed' && !hasTriggeredConfetti) {
              setHasTriggeredConfetti(true);
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
              });
            }
          }
        }
      } catch (e) {
        console.error('Error polling status:', e);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [jobId, hasTriggeredConfetti]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel max-w-lg w-full rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        {/* Close button */}
        {progress.status === 'completed' || progress.status === 'failed' ? (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        <div className="text-center mb-6">
          {progress.status === 'completed' ? (
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          ) : progress.status === 'failed' ? (
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 border border-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
          ) : (
            <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-3 border border-pink-500/20">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          )}

          <h3 className="text-xl font-bold text-white mb-1">
            {progress.status === 'completed' 
              ? 'Download Finished Successfully!' 
              : progress.status === 'failed'
              ? 'Download Interrupted'
              : 'Downloading Media Batch...'}
          </h3>
          <p className="text-xs text-slate-400">
            {progress.status === 'completed'
              ? `All files for @${username} are downloaded and organized into clean folders.`
              : `Processing posts, carousel slides & HD files.`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">
              Files: {progress.downloaded_files} / {progress.total_files}
            </span>
            <span className="text-pink-400 font-bold">{progress.percent}%</span>
          </div>

          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 rounded-full transition-all duration-300 shadow-lg shadow-pink-500/30"
              style={{ width: `${Math.min(progress.percent, 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 truncate text-center pt-1 font-mono">
            {progress.current_file || 'Downloading...'}
          </p>
        </div>

        {/* Action Buttons */}
        {progress.status === 'completed' && (
          <div className="space-y-3">
            <a
              href={`/api/download/zip/${jobId}`}
              download={`${username}_all_media.zip`}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition"
            >
              <FileArchive className="w-4 h-4" />
              <span>Download ZIP Archive to Computer</span>
            </a>

            <button
              onClick={() => onOpenFolder(username)}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Open Organized Folder in Mac Finder</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition text-center"
            >
              Close Window
            </button>
          </div>
        )}

        {progress.status === 'failed' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
              {progress.error_message || 'An error occurred during download.'}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
