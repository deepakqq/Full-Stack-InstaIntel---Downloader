# 📸 Instagram Growth Intelligence & Bulk Media Downloader

Ek powerful all-in-one Instagram Intelligence & Downloader tool jo kisi bhi public creator profile ko deeply analyze karta hai aur unka sara media (Reels, Videos, Photos, and Carousels) high-resolution me organize karke download karta hai.

---

## 🌟 Key Features

### 1. 📊 Creator Growth Intelligence & Analytics Dashboard
* **Engagement Rate (ER %):** `((Avg Likes + Avg Comments) / Followers) * 100` with qualitative rating (Low / Average / Good / Viral 🔥).
* **Day-of-Week & Hourly Heatmaps:** Bar & line charts showing best posting days and 24-hour UTC times.
* **Content Mix Breakdown:** Doughnut chart of Reels vs Carousels vs Single Photos.
* **Top 10 Performing & Viral Posts:** Ranked list of the creator's best posts with 1-click download.
* **Top 15 Hashtags & Keywords:** Frequency and average engagement tracking.
* **Actionable Growth Playbook:** Tailored recommendations on what strategy to adopt based on their performance data.

### 2. 📥 Smart Bulk & Individual Downloader
* **Bulk Download with Filters:** Download all media or filter by Reels, Single Photos, or Carousels.
* **Smart Carousel Handling:** Multi-slide posts automatically download into dedicated folders (`downloads/<username>/carousels/<date>_<id>/01.jpg, 02.mp4, caption.txt`).
* **Single Link Downloader:** Paste any direct post, reel, or carousel link to preview and download HD media.
* **ZIP Archive & Folder Organization:** Automatic `.zip` creation for 1-click browser download and Mac Finder folder opening.
* **Metadata Export:** Generates `.json` and `.csv` files containing all post metrics, captions, and links.

### 3. ⚙️ Session & Rate-Limit Handling
* Built-in session ID configuration for private profiles and unrestricted rate limits.
* Smart image/video proxy to prevent Instagram CDN 403 Forbidden / Referrer policy blocking.

---

## 📂 Downloads Directory Structure

```text
downloads/
└── [username]/
    ├── profile_hd.jpg
    ├── profile_and_posts.json
    ├── posts_analytics.csv
    ├── reels/
    │   ├── 2026-09-30_Cxyz_reel.mp4
    │   └── 2026-09-30_Cxyz_caption.txt
    ├── photos/
    │   ├── 2026-09-30_Dabc_photo.jpg
    │   └── 2026-09-30_Dabc_caption.txt
    └── carousels/
        └── 2026-09-30_Efg123/
            ├── slide_01.jpg
            ├── slide_02.mp4
            ├── slide_03.jpg
            └── caption.txt
```

---

## 🚀 How to Run the Application

### Option 1: Quick Shell Script
```bash
./run.sh
```

### Option 2: Python Command
```bash
source venv/bin/activate
python start.py
```

Browser automatically open ho jayega: **`http://127.0.0.1:8000`**

---

## 💻 Tech Stack
* **Backend:** Python 3, FastAPI, Uvicorn, Instaloader, yt-dlp, Httpx, Pydantic, Pandas.
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Chart.js, Canvas-Confetti.
