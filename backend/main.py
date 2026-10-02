import os
import uuid
import asyncio
import subprocess
from typing import Optional
import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.models import (
    ProfileAnalysisResponse,
    SingleMediaRequest,
    BulkDownloadRequest,
    DownloadProgress,
    ProfileInfo,
    MediaItem
)
from backend.scraper import InstagramScraper
from backend.analytics import AnalyticsEngine
from backend.downloader import MediaDownloader, DOWNLOADS_BASE

app = FastAPI(title="Instagram Intelligence & Media Downloader API")

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
active_session_id: Optional[str] = None
downloader = MediaDownloader()
cached_profiles: dict = {}

def get_scraper() -> InstagramScraper:
    return InstagramScraper(session_id=active_session_id)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_str = str(exc)
    if "401" in err_str or "login" in err_str.lower() or "unauthorized" in err_str.lower():
        msg = "Instagram guest rate limit reached. Please click 'IG Session' at top right and paste your session cookie to continue."
    else:
        msg = f"Error: {err_str}"
    return JSONResponse(
        status_code=400,
        content={"success": False, "detail": msg, "message": msg}
    )

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is running smoothly", "has_session": bool(active_session_id)}

@app.post("/api/settings/session")
async def set_session(payload: dict):
    global active_session_id
    session_id = payload.get("session_id", "").strip()
    active_session_id = session_id if session_id else None
    return {"success": True, "message": "Session updated successfully", "has_session": bool(active_session_id)}

@app.post("/api/profile/analyze", response_model=ProfileAnalysisResponse)
async def analyze_profile(payload: dict):
    input_text = payload.get("username", "").strip()
    if not input_text:
        raise HTTPException(status_code=400, detail="Username or Profile URL is required")

    scraper = get_scraper()
    username = scraper.clean_username(input_text)
    if not username:
        raise HTTPException(status_code=400, detail="Invalid username or URL provided")

    # 1. Try Web API first
    profile_info = None
    posts = []

    try:
        user_data = await scraper.fetch_profile_web_api(username)
        if user_data:
            profile_info, posts = scraper.parse_web_api_data(user_data)
    except Exception as e:
        print(f"Web API attempt notice for {username}: {e}")

    # 2. Fallback to Instaloader
    if not profile_info:
        try:
            loop = asyncio.get_event_loop()
            profile_info, posts = await loop.run_in_executor(None, scraper.fetch_profile_instaloader, username)
        except Exception as e:
            err_msg = str(e)
            if "401" in err_msg or "Please wait a few minutes" in err_msg or "login" in err_msg.lower():
                detail = "Instagram requires authentication for this request. Please click 'IG Session' at the top right and paste your session cookie (sessionid) to analyze profiles seamlessly."
            else:
                detail = f"Could not fetch profile '{username}'. Reason: {err_msg}"
            raise HTTPException(status_code=400, detail=detail)

    # Cache for subsequent bulk downloads
    cached_profiles[username.lower()] = (profile_info, posts)

    # Generate Analytics Report
    analytics = AnalyticsEngine.generate_report(profile_info, posts)

    return ProfileAnalysisResponse(
        success=True,
        profile=profile_info,
        posts=posts,
        analytics=analytics,
        message="Profile fetched and analyzed successfully"
    )

@app.post("/api/media/info")
async def get_single_media_info(request: SingleMediaRequest):
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")

    scraper = get_scraper()
    media_item = await scraper.fetch_single_media(request.url)
    if not media_item:
        raise HTTPException(
            status_code=400, 
            detail="Could not extract media. Instagram might require login or this post is private. Please configure 'IG Session' at top right."
        )

    return {"success": True, "media": media_item}

@app.post("/api/download/bulk")
async def start_bulk_download(request: BulkDownloadRequest, background_tasks: BackgroundTasks):
    username = request.username.lower()
    cached = cached_profiles.get(username)
    
    scraper = get_scraper()
    if not cached:
        user_data = await scraper.fetch_profile_web_api(username)
        if user_data:
            profile_info, posts = scraper.parse_web_api_data(user_data)
        else:
            loop = asyncio.get_event_loop()
            profile_info, posts = await loop.run_in_executor(None, scraper.fetch_profile_instaloader, username)
    else:
        profile_info, posts = cached

    job_id = str(uuid.uuid4())
    
    background_tasks.add_task(
        downloader.start_bulk_download,
        job_id=job_id,
        profile=profile_info,
        posts=posts,
        media_types=request.media_types,
        selected_shortcodes=request.selected_shortcodes,
        download_profile_pic=request.download_profile_pic,
        export_metadata=request.export_metadata
    )

    return {"success": True, "job_id": job_id, "message": "Bulk download initiated in background"}

@app.get("/api/download/status/{job_id}", response_model=DownloadProgress)
async def get_download_status(job_id: str):
    status = downloader.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status

@app.get("/api/download/zip/{job_id}")
async def download_zip(job_id: str):
    status = downloader.get_job_status(job_id)
    if not status or not status.zip_path or not os.path.exists(status.zip_path):
        raise HTTPException(status_code=404, detail="ZIP archive not found or not ready")
    
    filename = os.path.basename(status.zip_path)
    return FileResponse(status.zip_path, media_type="application/zip", filename=filename)

@app.get("/api/media/proxy")
async def proxy_media(url: str = Query(...)):
    """Proxy image/video CDN URLs so browser doesn't get blocked by 403 Forbidden / Referrer policy."""
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://www.instagram.com/"
    }

    async def stream_media():
        async with httpx.AsyncClient(headers=headers, timeout=30.0, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                if response.status_code != 200:
                    yield b""
                    return
                async for chunk in response.aiter_bytes(chunk_size=32768):
                    yield chunk

    return StreamingResponse(stream_media(), media_type="application/octet-stream")

@app.post("/api/system/open-folder")
async def open_downloads_folder(payload: dict):
    username = payload.get("username", "")
    target_path = os.path.join(DOWNLOADS_BASE, username) if username else DOWNLOADS_BASE
    if not os.path.exists(target_path):
        os.makedirs(target_path, exist_ok=True)
    
    try:
        subprocess.run(["open", target_path], check=True)
        return {"success": True, "message": f"Opened folder: {target_path}"}
    except Exception as e:
        return {"success": False, "message": str(e), "path": target_path}

# Serve frontend build if dist folder exists
frontend_dist = os.path.abspath("frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
