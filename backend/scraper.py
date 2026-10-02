import re
import json
import logging
import urllib.parse
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
import httpx
import instaloader
import yt_dlp

from backend.models import ProfileInfo, MediaItem, MediaChildItem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IGScraper")

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
]

DEFAULT_IG_APP_ID = "936619743392459"

class InstagramScraper:
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False
        )
        if session_id:
            try:
                self.loader.context._session.cookies.set("sessionid", session_id, domain=".instagram.com")
            except Exception as e:
                logger.warning(f"Could not set instaloader session: {e}")

    def clean_username(self, input_str: str) -> str:
        """Extract clean username from URL or text."""
        input_str = input_str.strip()
        # Remove query parameters if present
        if "?" in input_str:
            input_str = input_str.split("?")[0]
        if "#" in input_str:
            input_str = input_str.split("#")[0]
            
        # Check if URL
        if "instagram.com" in input_str:
            parsed = urllib.parse.urlparse(input_str)
            path_parts = [p for p in parsed.path.strip("/").split("/") if p]
            if path_parts:
                if path_parts[0] in ["p", "reel", "reels", "tv", "stories"]:
                    return input_str # URL itself
                return path_parts[0]
        # Remove @ or trailing slashes
        return input_str.lstrip("@").strip("/").strip()

    def extract_shortcode_from_url(self, url: str) -> Optional[str]:
        """Extract shortcode from post/reel URL."""
        if "?" in url:
            url = url.split("?")[0]
        match = re.search(r"(?:/p/|/reel/|/reels/|/tv/)([A-Za-z0-9_-]+)", url)
        if match:
            return match.group(1)
        return None

    def extract_hashtags(self, text: str) -> List[str]:
        if not text:
            return []
        return [tag.lower() for tag in re.findall(r"#(\w+)", text)]

    async def fetch_profile_web_api(self, username: str) -> Optional[Dict[str, Any]]:
        """Attempt to fetch profile using Instagram Web Profile API."""
        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={username}"
        headers = {
            "User-Agent": USER_AGENTS[0],
            "x-ig-app-id": DEFAULT_IG_APP_ID,
            "x-asbd-id": "129477",
            "x-requested-with": "XMLHttpRequest",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": f"https://www.instagram.com/{username}/",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        }
        cookies = {}
        if self.session_id:
            cookies["sessionid"] = self.session_id

        async with httpx.AsyncClient(headers=headers, cookies=cookies, timeout=15.0, follow_redirects=True) as client:
            try:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    user_data = data.get("data", {}).get("user")
                    if user_data:
                        return user_data
                logger.warning(f"Web API returned status {response.status_code}: {response.text[:150]}")
            except Exception as e:
                logger.warning(f"Web API fetch error: {e}")
        return None

    def fetch_profile_instaloader(self, username: str) -> Tuple[ProfileInfo, List[MediaItem]]:
        """Fetch profile using Instaloader."""
        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)
            
            profile_info = ProfileInfo(
                username=profile.username,
                full_name=profile.full_name or "",
                biography=profile.biography or "",
                external_url=profile.external_url,
                profile_pic_url=profile.profile_pic_url,
                profile_pic_url_hd=profile.profile_pic_url,
                is_private=profile.is_private,
                is_verified=profile.is_verified,
                is_business_account=profile.is_business_account,
                business_category_name=profile.business_category_name,
                posts_count=profile.mediacount,
                followers_count=profile.followers,
                following_count=profile.followees,
                id=str(profile.userid)
            )

            posts: List[MediaItem] = []
            if not profile.is_private:
                count = 0
                max_posts = 50
                for post in profile.get_posts():
                    if count >= max_posts:
                        break
                    
                    media_type = "photo"
                    if post.is_video:
                        media_type = "reel" if post.typename == "GraphVideo" and getattr(post, 'product_type', '') == 'clips' else "video"
                    elif post.typename == "GraphSidecar":
                        media_type = "carousel"
                    
                    carousel_items: List[MediaChildItem] = []
                    if post.typename == "GraphSidecar":
                        for node in post.get_sidecar_nodes():
                            carousel_items.append(
                                MediaChildItem(
                                    id=str(node.media_id or node.shortcode),
                                    media_type="video" if node.is_video else "image",
                                    display_url=node.display_url,
                                    video_url=node.video_url if node.is_video else None
                                )
                            )

                    caption = post.caption or ""
                    hashtags = self.extract_hashtags(caption)
                    likes = post.likes or 0
                    comments = post.comments or 0
                    views = post.video_view_count if post.is_video else None
                    
                    followers = max(profile.followers, 1)
                    er = round(((likes + comments) / followers) * 100, 3)

                    dt = post.date_utc or datetime.utcnow()
                    
                    media_item = MediaItem(
                        id=str(post.mediaid),
                        shortcode=post.shortcode,
                        url=f"https://www.instagram.com/p/{post.shortcode}/",
                        media_type=media_type,
                        caption=caption,
                        timestamp=int(dt.timestamp()),
                        date_str=dt.strftime("%Y-%m-%d %H:%M:%S"),
                        likes_count=likes,
                        comments_count=comments,
                        video_views_count=views,
                        display_url=post.url,
                        video_url=post.video_url if post.is_video else None,
                        is_carousel=bool(carousel_items),
                        carousel_items=carousel_items,
                        hashtags=hashtags,
                        engagement_rate=er
                    )
                    posts.append(media_item)
                    count += 1

            return profile_info, posts
        except Exception as e:
            logger.error(f"Instaloader error for {username}: {e}")
            raise e

    def parse_web_api_data(self, user_data: Dict[str, Any]) -> Tuple[ProfileInfo, List[MediaItem]]:
        """Parse raw Instagram Web Profile API dictionary into structured objects."""
        followers_count = user_data.get("edge_followed_by", {}).get("count", 0)
        following_count = user_data.get("edge_follow", {}).get("count", 0)
        posts_count = user_data.get("edge_owner_to_timeline_media", {}).get("count", 0)
        
        profile_info = ProfileInfo(
            username=user_data.get("username", ""),
            full_name=user_data.get("full_name", ""),
            biography=user_data.get("biography", ""),
            external_url=user_data.get("external_url"),
            profile_pic_url=user_data.get("profile_pic_url", ""),
            profile_pic_url_hd=user_data.get("profile_pic_url_hd", user_data.get("profile_pic_url", "")),
            is_private=user_data.get("is_private", False),
            is_verified=user_data.get("is_verified", False),
            is_business_account=user_data.get("is_business_account", False),
            business_category_name=user_data.get("category_name") or user_data.get("business_category_name"),
            posts_count=posts_count,
            followers_count=followers_count,
            following_count=following_count,
            id=str(user_data.get("id", ""))
        )

        posts: List[MediaItem] = []
        edges = user_data.get("edge_owner_to_timeline_media", {}).get("edges", [])
        
        for edge in edges:
            node = edge.get("node", {})
            typename = node.get("__typename", "")
            shortcode = node.get("shortcode", "")
            
            is_video = node.get("is_video", False)
            media_type = "photo"
            if typename == "GraphSidecar":
                media_type = "carousel"
            elif is_video or typename == "GraphVideo":
                media_type = "reel" if node.get("product_type") == "clips" else "video"
            
            # Caption
            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
            caption = caption_edges[0].get("node", {}).get("text", "") if caption_edges else ""
            
            # Carousel items
            carousel_items: List[MediaChildItem] = []
            if typename == "GraphSidecar":
                sidecar_edges = node.get("edge_sidecar_to_children", {}).get("edges", [])
                for idx, c_edge in enumerate(sidecar_edges):
                    c_node = c_edge.get("node", {})
                    carousel_items.append(
                        MediaChildItem(
                            id=str(c_node.get("id", f"{shortcode}_{idx}")),
                            media_type="video" if c_node.get("is_video") else "image",
                            display_url=c_node.get("display_url", ""),
                            video_url=c_node.get("video_url")
                        )
                    )

            likes = node.get("edge_media_preview_like", {}).get("count") or node.get("edge_liked_by", {}).get("count", 0)
            comments = node.get("edge_media_to_comment", {}).get("count", 0)
            views = node.get("video_view_count")
            
            followers_denom = max(followers_count, 1)
            er = round(((likes + comments) / followers_denom) * 100, 3)

            timestamp = node.get("taken_at_timestamp", int(datetime.utcnow().timestamp()))
            dt = datetime.utcfromtimestamp(timestamp)

            media_item = MediaItem(
                id=str(node.get("id", shortcode)),
                shortcode=shortcode,
                url=f"https://www.instagram.com/p/{shortcode}/",
                media_type=media_type,
                caption=caption,
                timestamp=timestamp,
                date_str=dt.strftime("%Y-%m-%d %H:%M:%S"),
                likes_count=likes,
                comments_count=comments,
                video_views_count=views,
                display_url=node.get("display_url", ""),
                video_url=node.get("video_url"),
                is_carousel=bool(carousel_items),
                carousel_items=carousel_items,
                hashtags=self.extract_hashtags(caption),
                engagement_rate=er
            )
            posts.append(media_item)

        return profile_info, posts

    async def fetch_single_media(self, url_or_shortcode: str) -> Optional[MediaItem]:
        """Fetch details of a single post, reel, or carousel."""
        shortcode = self.extract_shortcode_from_url(url_or_shortcode) or url_or_shortcode
        clean_url = f"https://www.instagram.com/p/{shortcode}/"

        # Strategy 1: yt-dlp metadata extraction
        try:
            ydl_opts = {
                'skip_download': True,
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(clean_url, download=False)
                if info:
                    entries = info.get('entries')
                    carousel_items: List[MediaChildItem] = []
                    
                    if entries:
                        for idx, entry in enumerate(entries):
                            carousel_items.append(
                                MediaChildItem(
                                    id=str(entry.get('id', f"{shortcode}_{idx}")),
                                    media_type="video" if entry.get('vcodec') != 'none' and entry.get('url', '').endswith(('.mp4', '.m4v')) else "image",
                                    display_url=entry.get('thumbnail') or entry.get('url', ''),
                                    video_url=entry.get('url') if entry.get('ext') == 'mp4' or 'video' in entry.get('format', '') else None
                                )
                            )

                    caption = info.get('description') or info.get('title') or ""
                    likes = info.get('like_count') or 0
                    comments = info.get('comment_count') or 0
                    views = info.get('view_count')
                    is_video = bool(info.get('ext') == 'mp4' or info.get('vcodec') != 'none')
                    
                    media_type = "carousel" if carousel_items else ("reel" if "reel" in url_or_shortcode or is_video else "photo")

                    timestamp = info.get('timestamp', int(datetime.utcnow().timestamp()))
                    dt = datetime.utcfromtimestamp(timestamp)

                    return MediaItem(
                        id=str(info.get('id', shortcode)),
                        shortcode=shortcode,
                        url=clean_url,
                        media_type=media_type,
                        caption=caption,
                        timestamp=timestamp,
                        date_str=dt.strftime("%Y-%m-%d %H:%M:%S"),
                        likes_count=likes,
                        comments_count=comments,
                        video_views_count=views,
                        display_url=info.get('thumbnail') or (carousel_items[0].display_url if carousel_items else ""),
                        video_url=info.get('url') if is_video else None,
                        is_carousel=bool(carousel_items),
                        carousel_items=carousel_items,
                        hashtags=self.extract_hashtags(caption),
                        engagement_rate=0.0
                    )
        except Exception as e:
            logger.warning(f"yt-dlp single media fetch failed: {e}")

        # Strategy 2: Instaloader fallback for single post
        try:
            post = instaloader.Post.from_shortcode(self.loader.context, shortcode)
            carousel_items: List[MediaChildItem] = []
            if post.typename == "GraphSidecar":
                for idx, node in enumerate(post.get_sidecar_nodes()):
                    carousel_items.append(
                        MediaChildItem(
                            id=str(node.media_id or f"{shortcode}_{idx}"),
                            media_type="video" if node.is_video else "image",
                            display_url=node.display_url,
                            video_url=node.video_url if node.is_video else None
                        )
                    )

            caption = post.caption or ""
            dt = post.date_utc or datetime.utcnow()

            return MediaItem(
                id=str(post.mediaid),
                shortcode=post.shortcode,
                url=f"https://www.instagram.com/p/{post.shortcode}/",
                media_type="carousel" if carousel_items else ("reel" if post.is_video else "photo"),
                caption=caption,
                timestamp=int(dt.timestamp()),
                date_str=dt.strftime("%Y-%m-%d %H:%M:%S"),
                likes_count=post.likes or 0,
                comments_count=post.comments or 0,
                video_views_count=post.video_view_count if post.is_video else None,
                display_url=post.url,
                video_url=post.video_url if post.is_video else None,
                is_carousel=bool(carousel_items),
                carousel_items=carousel_items,
                hashtags=self.extract_hashtags(caption),
                engagement_rate=0.0
            )
        except Exception as e:
            logger.error(f"Instaloader single fetch error: {e}")

        return None
