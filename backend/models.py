from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MediaChildItem(BaseModel):
    id: str
    media_type: str  # "image" or "video"
    display_url: str
    video_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

class MediaItem(BaseModel):
    id: str
    shortcode: str
    url: str
    media_type: str  # "photo", "video", "reel", "carousel"
    caption: str = ""
    timestamp: int = 0
    date_str: str = ""
    likes_count: int = 0
    comments_count: int = 0
    video_views_count: Optional[int] = None
    display_url: str = ""
    video_url: Optional[str] = None
    is_carousel: bool = False
    carousel_items: List[MediaChildItem] = []
    hashtags: List[str] = []
    engagement_rate: float = 0.0

class ProfileInfo(BaseModel):
    username: str
    full_name: str = ""
    biography: str = ""
    external_url: Optional[str] = None
    profile_pic_url: str = ""
    profile_pic_url_hd: str = ""
    is_private: bool = False
    is_verified: bool = False
    is_business_account: bool = False
    business_category_name: Optional[str] = None
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    id: Optional[str] = None

class BestPostingSlot(BaseModel):
    day: str
    hour: int
    hour_label: str
    avg_likes: float
    posts_count: int

class HashtagMetric(BaseModel):
    tag: str
    count: int
    avg_likes: float
    avg_comments: float

class AnalyticsReport(BaseModel):
    engagement_rate: float = 0.0
    engagement_rating: str = "Good"  # Low, Average, Good, Viral / Exceptional
    avg_likes: float = 0.0
    avg_comments: float = 0.0
    avg_views: float = 0.0
    follower_to_following_ratio: float = 0.0
    
    # Distribution
    content_distribution: Dict[str, int] = Field(default_factory=dict)
    content_percentage: Dict[str, float] = Field(default_factory=dict)
    
    # Timing & Frequency
    posts_analyzed: int = 0
    estimated_weekly_frequency: float = 0.0
    best_posting_days: List[Dict[str, Any]] = Field(default_factory=list)
    best_posting_hours: List[Dict[str, Any]] = Field(default_factory=list)
    best_slots: List[BestPostingSlot] = Field(default_factory=list)
    
    # Content & Hashtags
    top_hashtags: List[HashtagMetric] = Field(default_factory=list)
    top_posts: List[MediaItem] = Field(default_factory=list)
    growth_tips: List[str] = Field(default_factory=list)

class ProfileAnalysisResponse(BaseModel):
    success: bool
    profile: ProfileInfo
    posts: List[MediaItem]
    analytics: AnalyticsReport
    message: Optional[str] = None

class SingleMediaRequest(BaseModel):
    url: str

class BulkDownloadRequest(BaseModel):
    username: str
    media_types: List[str] = ["photo", "video", "reel", "carousel"]
    selected_shortcodes: Optional[List[str]] = None
    download_profile_pic: bool = True
    export_metadata: bool = True

class DownloadProgress(BaseModel):
    job_id: str
    status: str  # "pending", "in_progress", "completed", "failed"
    total_files: int = 0
    downloaded_files: int = 0
    current_file: str = ""
    percent: float = 0.0
    error_message: Optional[str] = None
    zip_path: Optional[str] = None
    download_dir: Optional[str] = None
