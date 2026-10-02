import os
import shutil
import zipfile
import asyncio
import logging
import json
import csv
from typing import Dict, List, Optional
import httpx
from datetime import datetime

from backend.models import ProfileInfo, MediaItem, DownloadProgress

logger = logging.getLogger("IGDownloader")

DOWNLOADS_BASE = os.path.abspath("downloads")

class MediaDownloader:
    def __init__(self):
        self.jobs: Dict[str, DownloadProgress] = {}
        os.makedirs(DOWNLOADS_BASE, exist_ok=True)

    def get_job_status(self, job_id: str) -> Optional[DownloadProgress]:
        return self.jobs.get(job_id)

    async def _download_file(self, url: str, dest_path: str, client: httpx.AsyncClient) -> bool:
        if not url:
            return False
        try:
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            async with client.stream("GET", url) as response:
                if response.status_code == 200:
                    with open(dest_path, "wb") as f:
                        async for chunk in response.aiter_bytes(chunk_size=65536):
                            f.write(chunk)
                    return True
                else:
                    logger.warning(f"Download failed status {response.status_code} for {url}")
        except Exception as e:
            logger.error(f"Error downloading {url} to {dest_path}: {e}")
        return False

    def _create_zip(self, folder_path: str, zip_output_path: str):
        with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(folder_path):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, folder_path)
                    zipf.write(full_path, rel_path)

    async def start_bulk_download(
        self,
        job_id: str,
        profile: ProfileInfo,
        posts: List[MediaItem],
        media_types: List[str],
        selected_shortcodes: Optional[List[str]] = None,
        download_profile_pic: bool = True,
        export_metadata: bool = True
    ):
        target_posts = posts
        if selected_shortcodes:
            shortcode_set = set(selected_shortcodes)
            target_posts = [p for p in posts if p.shortcode in shortcode_set]
        elif media_types:
            type_set = set(media_types)
            target_posts = [p for p in posts if p.media_type in type_set]

        # Calculate total files expected
        total_items = 0
        if download_profile_pic and (profile.profile_pic_url_hd or profile.profile_pic_url):
            total_items += 1
        for p in target_posts:
            if p.is_carousel and p.carousel_items:
                total_items += len(p.carousel_items)
            else:
                total_items += 1

        total_items = max(total_items, 1)

        progress = DownloadProgress(
            job_id=job_id,
            status="in_progress",
            total_files=total_items,
            downloaded_files=0,
            percent=0.0
        )
        self.jobs[job_id] = progress

        user_dir = os.path.join(DOWNLOADS_BASE, profile.username)
        os.makedirs(user_dir, exist_ok=True)
        progress.download_dir = user_dir

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://www.instagram.com/"
        }

        async with httpx.AsyncClient(headers=headers, timeout=30.0, follow_redirects=True) as client:
            try:
                # 1. Download Profile Pic
                if download_profile_pic:
                    pic_url = profile.profile_pic_url_hd or profile.profile_pic_url
                    if pic_url:
                        pic_path = os.path.join(user_dir, "profile_hd.jpg")
                        progress.current_file = "profile_hd.jpg"
                        success = await self._download_file(pic_url, pic_path, client)
                        if success:
                            progress.downloaded_files += 1
                            progress.percent = round((progress.downloaded_files / total_items) * 100, 1)

                # 2. Download Media items
                for post in target_posts:
                    clean_date = post.date_str.split(" ")[0] if post.date_str else "post"
                    shortcode = post.shortcode

                    if post.is_carousel and post.carousel_items:
                        carousel_dir = os.path.join(user_dir, "carousels", f"{clean_date}_{shortcode}")
                        os.makedirs(carousel_dir, exist_ok=True)
                        
                        # Save caption in carousel folder
                        if post.caption:
                            with open(os.path.join(carousel_dir, "caption.txt"), "w", encoding="utf-8") as cf:
                                cf.write(post.caption)

                        for idx, item in enumerate(post.carousel_items):
                            ext = ".mp4" if item.media_type == "video" else ".jpg"
                            filename = f"slide_{idx+1:02d}{ext}"
                            file_path = os.path.join(carousel_dir, filename)
                            progress.current_file = f"{clean_date}_{shortcode}/{filename}"
                            
                            media_url = item.video_url if item.media_type == "video" and item.video_url else item.display_url
                            success = await self._download_file(media_url, file_path, client)
                            if success:
                                progress.downloaded_files += 1
                                progress.percent = round((progress.downloaded_files / total_items) * 100, 1)
                            await asyncio.sleep(0.05) # Polite delay
                    else:
                        is_video = bool(post.video_url or post.media_type in ["video", "reel"])
                        sub_folder = "reels" if post.media_type == "reel" else ("videos" if is_video else "photos")
                        target_dir = os.path.join(user_dir, sub_folder)
                        os.makedirs(target_dir, exist_ok=True)

                        ext = ".mp4" if is_video else ".jpg"
                        filename = f"{clean_date}_{shortcode}{ext}"
                        file_path = os.path.join(target_dir, filename)
                        progress.current_file = f"{sub_folder}/{filename}"

                        media_url = post.video_url if is_video and post.video_url else post.display_url
                        success = await self._download_file(media_url, file_path, client)
                        if success:
                            progress.downloaded_files += 1
                            progress.percent = round((progress.downloaded_files / total_items) * 100, 1)
                        
                        # Save single caption if present
                        if post.caption:
                            caption_path = os.path.join(target_dir, f"{clean_date}_{shortcode}_caption.txt")
                            with open(caption_path, "w", encoding="utf-8") as cf:
                                cf.write(post.caption)
                                
                        await asyncio.sleep(0.05)

                # 3. Export Metadata JSON & CSV
                if export_metadata:
                    # JSON export
                    json_path = os.path.join(user_dir, "profile_and_posts.json")
                    with open(json_path, "w", encoding="utf-8") as jf:
                        json.dump({
                            "profile": profile.model_dump(),
                            "posts": [p.model_dump() for p in target_posts]
                        }, jf, indent=2)

                    # CSV export
                    csv_path = os.path.join(user_dir, "posts_analytics.csv")
                    with open(csv_path, "w", newline="", encoding="utf-8") as cf:
                        writer = csv.writer(cf)
                        writer.writerow(["Shortcode", "Type", "Date", "Likes", "Comments", "Views", "ER %", "Hashtags", "URL", "Caption"])
                        for p in target_posts:
                            writer.writerow([
                                p.shortcode,
                                p.media_type,
                                p.date_str,
                                p.likes_count,
                                p.comments_count,
                                p.video_views_count or 0,
                                p.engagement_rate,
                                ", ".join(p.hashtags),
                                p.url,
                                p.caption.replace("\n", " ")[:200]
                            ])

                # 4. Generate Zip Archive
                zip_path = os.path.join(DOWNLOADS_BASE, f"{profile.username}_archive_{job_id[:8]}.zip")
                self._create_zip(user_dir, zip_path)
                progress.zip_path = zip_path

                progress.status = "completed"
                progress.percent = 100.0
                progress.current_file = "Done!"

            except Exception as e:
                logger.error(f"Bulk download failed for job {job_id}: {e}")
                progress.status = "failed"
                progress.error_message = str(e)
