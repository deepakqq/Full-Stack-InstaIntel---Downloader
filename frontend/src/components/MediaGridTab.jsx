import React, { useState } from 'react';
import { 
  Download, 
  Layers, 
  Film, 
  Image as ImageIcon, 
  Heart, 
  MessageCircle, 
  CheckSquare, 
  Square, 
  Filter, 
  Eye, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function MediaGridTab({ posts, onTriggerBulkDownload, onDownloadSingle }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedShortcodes, setSelectedShortcodes] = useState(new Set());
  const [previewCarouselPost, setPreviewCarouselPost] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  if (!posts || posts.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800">
        <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Media Found</h3>
        <p className="text-sm text-slate-400 mt-1">This account might be private or hasn't posted any media yet.</p>
      </div>
    );
  }

  // Filtering
  const filteredPosts = posts.filter(post => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'reels') return post.media_type === 'reel' || post.media_type === 'video';
    if (selectedFilter === 'photos') return post.media_type === 'photo';
    if (selectedFilter === 'carousels') return post.is_carousel || post.media_type === 'carousel';
    return true;
  });

  // Sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'newest') return b.timestamp - a.timestamp;
    if (sortBy === 'oldest') return a.timestamp - b.timestamp;
    if (sortBy === 'likes') return b.likes_count - a.likes_count;
    if (sortBy === 'comments') return b.comments_count - a.comments_count;
    if (sortBy === 'er') return b.engagement_rate - a.engagement_rate;
    return 0;
  });

  const toggleSelect = (shortcode) => {
    const next = new Set(selectedShortcodes);
    if (next.has(shortcode)) {
      next.delete(shortcode);
    } else {
      next.add(shortcode);
    }
    setSelectedShortcodes(next);
  };

  const selectAll = () => {
    if (selectedShortcodes.size === sortedPosts.length) {
      setSelectedShortcodes(new Set());
    } else {
      setSelectedShortcodes(new Set(sortedPosts.map(p => p.shortcode)));
    }
  };

  const handleDownloadSelected = () => {
    if (selectedShortcodes.size === 0) {
      onTriggerBulkDownload(Array.from(sortedPosts.map(p => p.shortcode)));
    } else {
      onTriggerBulkDownload(Array.from(selectedShortcodes));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Control Bar: Filters, Sorters, Bulk Actions */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedFilter === 'all'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            All Media ({posts.length})
          </button>
          <button
            onClick={() => setSelectedFilter('reels')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedFilter === 'reels'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Reels / Videos</span>
          </button>
          <button
            onClick={() => setSelectedFilter('carousels')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedFilter === 'carousels'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Carousels (Multi-slide)</span>
          </button>
          <button
            onClick={() => setSelectedFilter('photos')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedFilter === 'photos'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Single Photos</span>
          </button>
        </div>

        {/* Right Controls: Sort & Bulk Download */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-pink-500 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="likes">Most Liked</option>
              <option value="comments">Most Comments</option>
              <option value="er">Highest ER %</option>
            </select>
          </div>

          <button
            onClick={selectAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            {selectedShortcodes.size === sortedPosts.length ? (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-pink-400" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Select All</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSelected}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-xs shadow-md shadow-pink-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {selectedShortcodes.size > 0 
                ? `Download Selected (${selectedShortcodes.size})` 
                : `Download All (${sortedPosts.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Posts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedPosts.map((post) => {
          const isSelected = selectedShortcodes.has(post.shortcode);
          const thumb = post.display_url 
            ? `/api/media/proxy?url=${encodeURIComponent(post.display_url)}`
            : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80';

          return (
            <div
              key={post.shortcode}
              className={`group relative bg-slate-900 rounded-2xl overflow-hidden border transition flex flex-col ${
                isSelected ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Checkbox select */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(post.shortcode);
                }}
                className="absolute top-2.5 left-2.5 z-20 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white transition hover:bg-black/90"
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-pink-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 group-hover:text-white" />
                )}
              </button>

              {/* Type Badge */}
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-semibold text-slate-200">
                {post.is_carousel ? (
                  <>
                    <Layers className="w-3 h-3 text-sky-400" />
                    <span>{post.carousel_items?.length || 'Multi'}</span>
                  </>
                ) : post.media_type === 'reel' || post.media_type === 'video' ? (
                  <>
                    <Film className="w-3 h-3 text-rose-400" />
                    <span>Reel</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                    <span>Photo</span>
                  </>
                )}
              </div>

              {/* Image Preview Container */}
              <div className="relative aspect-square overflow-hidden bg-slate-950 cursor-pointer">
                <img
                  src={thumb}
                  alt={post.shortcode}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                  {post.is_carousel ? (
                    <button
                      onClick={() => {
                        setPreviewCarouselPost(post);
                        setActiveSlideIndex(0);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800/90 text-sky-400 hover:bg-sky-500 hover:text-white transition shadow-lg"
                      title="View Carousel Slides"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    onClick={() => onDownloadSingle(post)}
                    className="p-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white transition shadow-lg"
                    title="Download this post/media"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white transition shadow-lg"
                    title="Open on Instagram"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Bottom Metadata */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                  <span className="flex items-center space-x-1 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                    <span>{post.likes_count.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-blue-400">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.comments_count.toLocaleString()}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 italic mb-2">
                  {post.caption || 'No caption'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span>{post.date_str ? post.date_str.split(' ')[0] : ''}</span>
                  <span className="text-amber-400 font-medium">ER {post.engagement_rate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carousel Inspection Modal */}
      {previewCarouselPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-2xl w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  Carousel Slides ({activeSlideIndex + 1} of {previewCarouselPost.carousel_items.length})
                </h3>
              </div>
              <button
                onClick={() => setPreviewCarouselPost(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slide Media Viewer */}
            <div className="relative aspect-square max-h-[450px] bg-black flex items-center justify-center overflow-hidden">
              {(() => {
                const currentSlide = previewCarouselPost.carousel_items[activeSlideIndex];
                if (!currentSlide) return null;

                const mediaUrl = `/api/media/proxy?url=${encodeURIComponent(currentSlide.video_url || currentSlide.display_url)}`;
                
                if (currentSlide.media_type === 'video') {
                  return (
                    <video
                      key={currentSlide.id}
                      src={mediaUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                } else {
                  return (
                    <img
                      key={currentSlide.id}
                      src={mediaUrl}
                      alt={`Slide ${activeSlideIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  );
                }
              })()}

              {/* Navigation Arrows */}
              {activeSlideIndex > 0 && (
                <button
                  onClick={() => setActiveSlideIndex(prev => prev - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-pink-600 transition shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {activeSlideIndex < previewCarouselPost.carousel_items.length - 1 && (
                <button
                  onClick={() => setActiveSlideIndex(prev => prev + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-pink-600 transition shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              {/* Thumbnails row */}
              <div className="flex items-center space-x-2 overflow-x-auto max-w-[60%] custom-scrollbar py-1">
                {previewCarouselPost.carousel_items.map((slide, idx) => (
                  <button
                    key={slide.id || idx}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                      activeSlideIndex === idx ? 'border-pink-500 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img
                      src={`/api/media/proxy?url=${encodeURIComponent(slide.display_url)}`}
                      alt={`thumb-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Download buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const currentSlide = previewCarouselPost.carousel_items[activeSlideIndex];
                    const url = currentSlide.video_url || currentSlide.display_url;
                    const a = document.createElement('a');
                    a.href = `/api/media/proxy?url=${encodeURIComponent(url)}`;
                    a.download = `slide_${activeSlideIndex + 1}_${previewCarouselPost.shortcode}.${currentSlide.media_type === 'video' ? 'mp4' : 'jpg'}`;
                    a.click();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  Download Slide
                </button>

                <button
                  onClick={() => onDownloadSingle(previewCarouselPost)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-semibold shadow-lg shadow-pink-500/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Entire Folder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
