import React, { useState } from 'react';
import { Key, X, Check, ShieldCheck, HelpCircle } from 'lucide-react';

export default function SessionModal({ isOpen, onClose }) {
  const [sessionId, setSessionId] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/settings/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel max-w-md w-full rounded-3xl p-6 border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Instagram Session Cookie</h3>
            <p className="text-xs text-slate-400">Optional: For higher limits & private accounts</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              `sessionid` Cookie Value
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g. 54321%3Aabcde12345..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>How to find your sessionid:</span>
            </div>
            <p>1. Open Instagram in your browser and log in.</p>
            <p>2. Open DevTools (`F12` or `Cmd+Option+I`) → **Application / Storage** tab.</p>
            <p>3. Go to **Cookies** → `https://www.instagram.com` → copy value of `sessionid`.</p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
