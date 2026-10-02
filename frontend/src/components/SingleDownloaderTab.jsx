import React, { useState } from 'react';
import { 
  Download, 
  Link as LinkIcon, 
  Search, 
  Layers, 
  Film, 
  Image as ImageIcon, 
  Heart, 
  MessageCircle, 
  CheckCircle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function SingleDownloaderTab({ onDownloadSingle }) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaItem, setMediaItem] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleFetchMedia = async (e) => {
    e?.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);
    setMediaItem(null);
    setActiveSlide(0);

    try {
      const res = await fetch('/api/media/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || 'Could not fetch media. Please verify the URL.');
      }
      setMediaItem(data.media);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Search Input Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center relative overflow-hidden shadow-2xl">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 mb-4">
            <LinkIcon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Single Post, Reel or Carousel Downloader</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            Paste any direct Instagram URL below to instantly preview and download full HD video, photo, or multi-image carousels.
          </p>

          <form onSubmit={handleFetchMedia} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.instagram.com/reel/C3abcxyz... or /p/..."
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-pink-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 transition active:scale-95 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Media...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Fetch & Preview</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-left">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Card */}
      {mediaItem && (
        <div className="glass-panel rounded-3xl border border-pink-500/30 overflow-hidden shadow-2xl animate-scaleUp">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Visual Media Viewer */}
            <div className="relative bg-black flex items-center justify-center min-h-[380px] overflow-hidden">
              {mediaItem.is_carousel && mediaItem.carousel_items?.length > 0 ? (
                <>
                  {(() => {
                    const currentSlide = mediaItem.carousel_items[activeSlide];
                    const mediaUrl = `/api/media/proxy?url=${encodeURIComponent(currentSlide.video_url || currentSlide.display_url)}`;
                    if (currentSlide.media_type === 'video') {
                      return (
                        <video
                          key={currentSlide.id}
                          src={mediaUrl}
                          controls
                          className="w-full h-full max-h-[450px] object-contain"
                        />
                      );
                    }
                    return (
                      <img
                        key={currentSlide.id}
                        src={mediaUrl}
                        alt="Slide"
                        className="w-full h-full max-h-[450px] object-contain"
                      />
                    );
                  })()}

                  {/* Carousel Slide Nav */}
                  {activeSlide > 0 && (
                    <button
                      onClick={() => setActiveSlide(prev => prev - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-pink-600 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {activeSlide < mediaItem.carousel_items.length - 1 && (
                    <button
                      onClick={() => setActiveSlide(prev => prev + 1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 text-white hover:bg-pink-600 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-semibold text-white">
                    Slide {activeSlide + 1} of {mediaItem.carousel_items.length}
                  </div>
                </>
              ) : mediaItem.video_url || mediaItem.media_type === 'reel' || mediaItem.media_type === 'video' ? (
                <video
                  src={`/api/media/proxy?url=${encodeURIComponent(mediaItem.video_url || mediaItem.display_url)}`}
                  controls
                  className="w-full h-full max-h-[450px] object-contain"
                />
              ) : (
                <img
                  src={`/api/media/proxy?url=${encodeURIComponent(mediaItem.display_url)}`}
                  alt={mediaItem.shortcode}
                  className="w-full h-full max-h-[450px] object-contain"
                />
              )}
            </div>

            {/* Media Metadata & Download Actions */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    {mediaItem.is_carousel ? (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        <span>Carousel ({mediaItem.carousel_items?.length} Items)</span>
                      </>
                    ) : mediaItem.media_type === 'reel' || mediaItem.media_type === 'video' ? (
                      <>
                        <Film className="w-3.5 h-3.5" />
                        <span>Reel / Video</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>High-Res Photo</span>
                      </>
                    )}
                  </span>

                  <a
                    href={mediaItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs text-sky-400 hover:underline"
                  >
                    <span>Instagram ↗</span>
                  </a>
                </div>

                {/* Engagement stats */}
                <div className="flex items-center space-x-4 mb-4 text-xs font-semibold">
                  <span className="flex items-center space-x-1 text-rose-400">
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                    <span>{mediaItem.likes_count.toLocaleString()} Likes</span>
                  </span>
                  <span className="flex items-center space-x-1 text-blue-400">
                    <MessageCircle className="w-4 h-4" />
                    <span>{mediaItem.comments_count.toLocaleString()} Comments</span>
                  </span>
                </div>

                {/* Caption */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 max-h-44 overflow-y-auto custom-scrollbar whitespace-pre-line leading-relaxed mb-4">
                  {mediaItem.caption || 'No caption provided.'}
                </div>

                {/* Hashtags */}
                {mediaItem.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mediaItem.hashtags.map((t, idx) => (
                      <span key={idx} className="text-[11px] text-pink-400 bg-pink-500/5 px-2 py-0.5 rounded-md border border-pink-500/10">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Download Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                {mediaItem.is_carousel && mediaItem.carousel_items?.length > 0 ? (
                  <>
                    <button
                      onClick={() => {
                        const current = mediaItem.carousel_items[activeSlide];
                        const url = current.video_url || current.display_url;
                        const a = document.createElement('a');
                        a.href = `/api/media/proxy?url=${encodeURIComponent(url)}`;
                        a.download = `slide_${activeSlide + 1}_${mediaItem.shortcode}.${current.media_type === 'video' ? 'mp4' : 'jpg'}`;
                        a.click();
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      Download Slide #{activeSlide + 1}
                    </button>

                    <button
                      onClick={() => onDownloadSingle(mediaItem)}
                      className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All {mediaItem.carousel_items.length} Slides in Folder</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onDownloadSingle(mediaItem)}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Media File HD</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
