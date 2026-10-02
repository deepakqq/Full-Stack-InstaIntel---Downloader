from typing import List, Dict, Any
from collections import defaultdict
from datetime import datetime
from backend.models import ProfileInfo, MediaItem, AnalyticsReport, HashtagMetric, BestPostingSlot

DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

class AnalyticsEngine:
    @staticmethod
    def generate_report(profile: ProfileInfo, posts: List[MediaItem]) -> AnalyticsReport:
        if not posts:
            return AnalyticsReport(
                engagement_rate=0.0,
                engagement_rating="No Data",
                avg_likes=0.0,
                avg_comments=0.0,
                avg_views=0.0,
                follower_to_following_ratio=round(profile.followers_count / max(profile.following_count, 1), 2),
                posts_analyzed=0,
                growth_tips=["Publish your first public posts to start tracking analytics!"]
            )

        total_likes = sum(p.likes_count for p in posts)
        total_comments = sum(p.comments_count for p in posts)
        video_views = [p.video_views_count for p in posts if p.video_views_count is not None]
        avg_views = round(sum(video_views) / len(video_views), 1) if video_views else 0.0

        n_posts = len(posts)
        avg_likes = round(total_likes / n_posts, 1)
        avg_comments = round(total_comments / n_posts, 1)

        followers = max(profile.followers_count, 1)
        er = round(((avg_likes + avg_comments) / followers) * 100, 2)

        # Rating
        if er < 1.0:
            rating = "Needs Improvement (<1%)"
        elif er < 3.0:
            rating = "Average (1% - 3%)"
        elif er < 6.0:
            rating = "Good & Healthy (3% - 6%)"
        else:
            rating = "Viral / High Engagement (>6%) 🔥"

        ratio = round(profile.followers_count / max(profile.following_count, 1), 2)

        # Content Mix
        distribution = defaultdict(int)
        for p in posts:
            distribution[p.media_type] += 1
        
        content_dist = dict(distribution)
        content_pct = {k: round((v / n_posts) * 100, 1) for k, v in content_dist.items()}

        # Timing analysis (Day & Hour)
        day_stats = defaultdict(lambda: {"likes": 0, "count": 0, "comments": 0})
        hour_stats = defaultdict(lambda: {"likes": 0, "count": 0, "comments": 0})
        slot_stats = defaultdict(lambda: {"likes": 0, "count": 0, "comments": 0})

        for p in posts:
            dt = datetime.utcfromtimestamp(p.timestamp)
            day_name = DAYS_OF_WEEK[dt.weekday()]
            hour = dt.hour

            day_stats[day_name]["likes"] += p.likes_count
            day_stats[day_name]["comments"] += p.comments_count
            day_stats[day_name]["count"] += 1

            hour_stats[hour]["likes"] += p.likes_count
            hour_stats[hour]["comments"] += p.comments_count
            hour_stats[hour]["count"] += 1

            slot_key = (day_name, hour)
            slot_stats[slot_key]["likes"] += p.likes_count
            slot_stats[slot_key]["count"] += 1

        best_days = []
        for day in DAYS_OF_WEEK:
            info = day_stats.get(day, {"likes": 0, "count": 0, "comments": 0})
            cnt = info["count"]
            avg_l = round(info["likes"] / cnt, 1) if cnt > 0 else 0.0
            avg_c = round(info["comments"] / cnt, 1) if cnt > 0 else 0.0
            best_days.append({
                "day": day,
                "posts_count": cnt,
                "avg_likes": avg_l,
                "avg_comments": avg_c,
                "total_engagement": round(avg_l + avg_c, 1)
            })

        best_hours = []
        for h in range(24):
            info = hour_stats.get(h, {"likes": 0, "count": 0, "comments": 0})
            cnt = info["count"]
            avg_l = round(info["likes"] / cnt, 1) if cnt > 0 else 0.0
            best_hours.append({
                "hour": h,
                "hour_label": f"{h:02d}:00 UTC",
                "posts_count": cnt,
                "avg_likes": avg_l
            })

        best_slots: List[BestPostingSlot] = []
        for (day_name, hour), stat in sorted(slot_stats.items(), key=lambda item: item[1]["likes"] / max(item[1]["count"], 1), reverse=True)[:5]:
            best_slots.append(
                BestPostingSlot(
                    day=day_name,
                    hour=hour,
                    hour_label=f"{hour:02d}:00 UTC",
                    avg_likes=round(stat["likes"] / stat["count"], 1),
                    posts_count=stat["count"]
                )
            )

        # Top Hashtags
        hashtag_data = defaultdict(lambda: {"count": 0, "likes": 0, "comments": 0})
        for p in posts:
            for tag in set(p.hashtags):
                hashtag_data[tag]["count"] += 1
                hashtag_data[tag]["likes"] += p.likes_count
                hashtag_data[tag]["comments"] += p.comments_count

        top_hashtags: List[HashtagMetric] = []
        for tag, data in sorted(hashtag_data.items(), key=lambda x: (x[1]["count"], x[1]["likes"]), reverse=True)[:15]:
            cnt = data["count"]
            top_hashtags.append(
                HashtagMetric(
                    tag=f"#{tag}",
                    count=cnt,
                    avg_likes=round(data["likes"] / cnt, 1),
                    avg_comments=round(data["comments"] / cnt, 1)
                )
            )

        # Top Performing Posts (Sorted by Likes)
        top_posts = sorted(posts, key=lambda x: x.likes_count + (x.comments_count * 2), reverse=True)[:10]

        # Estimated Weekly Frequency
        timestamps = sorted([p.timestamp for p in posts])
        if len(timestamps) > 1:
            time_span_days = max((timestamps[-1] - timestamps[0]) / 86400, 1.0)
            weekly_freq = round((len(posts) / time_span_days) * 7, 1)
        else:
            weekly_freq = float(len(posts))

        # Growth & Strategy Actionable Tips
        tips = []
        reel_count = content_dist.get("reel", 0) + content_dist.get("video", 0)
        reel_pct = content_pct.get("reel", 0.0) + content_pct.get("video", 0.0)
        
        if reel_pct < 40:
            tips.append(f"📹 **Increase Reels output:** Currently only {reel_pct}% of content is video/reels. Instagram's algorithm heavily favors 9:16 reels for non-follower discovery.")
        else:
            tips.append("🚀 **Strong Reel Focus:** Great video cadence! Reels are driving your profile visibility across the Explore feed.")

        carousel_pct = content_pct.get("carousel", 0.0)
        if carousel_pct > 25:
            tips.append(f"📚 **Carousels retention:** {carousel_pct}% carousel mix is excellent for high dwell time, saves, and shares.")
        else:
            tips.append("💡 **Add Multi-Slide Carousels:** Carousel posts encourage users to swipe, signalling high engagement to the algorithm.")

        if best_slots:
            best_slot = best_slots[0]
            tips.append(f"⏰ **Optimal Publishing Window:** Highest engagement occurs on **{best_slot.day} at {best_slot.hour_label}** with avg {best_slot.avg_likes:,.0f} likes.")

        if top_hashtags:
            top_3 = ", ".join([h.tag for h in top_hashtags[:3]])
            tips.append(f"🏷️ **Top Converting Hashtags:** Content with {top_3} generates above-average interactions.")

        if er >= 4.0:
            tips.append("🔥 **Audience Loyalty:** Your engagement rate is exceptional (>4%). Monetization and brand collaboration readiness is high.")
        elif er < 1.5:
            tips.append("💬 **Boost Call-To-Actions (CTAs):** Add questions at the end of captions or pin engaging comments to boost the comment-to-like ratio.")

        return AnalyticsReport(
            engagement_rate=er,
            engagement_rating=rating,
            avg_likes=avg_likes,
            avg_comments=avg_comments,
            avg_views=avg_views,
            follower_to_following_ratio=ratio,
            content_distribution=content_dist,
            content_percentage=content_pct,
            posts_analyzed=n_posts,
            estimated_weekly_frequency=weekly_freq,
            best_posting_days=best_days,
            best_posting_hours=best_hours,
            best_slots=best_slots,
            top_hashtags=top_hashtags,
            top_posts=top_posts,
            growth_tips=tips
        )
