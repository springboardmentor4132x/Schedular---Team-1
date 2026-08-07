"""LinkedIn analytics synchronization service."""

import logging
import httpx
import urllib.parse
from sqlalchemy.orm import Session

from app.models.content import Post, PublishingLog, AnalyticsMetric
from app.models.analytics import PostAnalytics, PlatformAnalytics
from app.services.token_service import ensure_valid_token
from app.models.user import SocialAccount

logger = logging.getLogger(__name__)


async def sync_linkedin_post_analytics(db: Session, post: Post):
    """Fetch social action metrics for a published LinkedIn post and update tables."""
    # 1. Find the URN/external_post_id for LinkedIn
    log = db.query(PublishingLog).filter(
        PublishingLog.post_id == post.id,
        PublishingLog.platform == "linkedin",
        PublishingLog.status == "published"
    ).first()

    if not log or not log.external_post_id:
        logger.warning("No published LinkedIn log or URN found for post id=%s", post.id)
        return

    urn = log.external_post_id

    # 2. Get the user's social account and token
    account = db.query(SocialAccount).filter(
        SocialAccount.user_id == post.owner_id,
        SocialAccount.platform == "linkedin",
        SocialAccount.status == "connected"
    ).first()

    if not account:
        logger.warning("No connected LinkedIn account found for user id=%s", post.owner_id)
        return

    try:
        access_token = await ensure_valid_token(db, account)
    except Exception as exc:
        logger.error("Failed to retrieve valid access token for LinkedIn account: %s", exc)
        return

    # 3. Call LinkedIn API to fetch reactions/comments
    likes = None
    comments = None
    shares = None
    analytics_available = True
    error_reason = None

    encoded_urn = urllib.parse.quote(urn)
    url = f"https://api.linkedin.com/v2/socialActions/{encoded_urn}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }

    async with httpx.AsyncClient() as client:
        try:
            logger.info("LinkedIn calling endpoint: GET %s", url)
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            likes_summary = data.get("likesSummary", {})
            likes = likes_summary.get("totalLikes") or likes_summary.get("aggregatedLikeCount") or 0

            comments_summary = data.get("commentsSummary", {})
            comments = comments_summary.get("totalComments") or comments_summary.get("aggregatedCommentCount") or 0
            
            # Note: shares is not returned by socialActions endpoint
            shares = 0

            logger.info(
                "Successfully fetched social actions for %s: likes=%s, comments=%s",
                urn, likes, comments
            )
        except Exception as exc:
            logger.error("Error fetching LinkedIn socialActions for post %s (%s): %s", post.id, urn, exc)
            # Set availability to False and save error reason instead of silently ignoring or writing 0
            analytics_available = False
            error_reason = f"{type(exc).__name__}: {str(exc)}"

    # 4. Save to post_analytics table
    # reach, impressions, clicks, saves, engagement_rate are always NULL (None)
    # for LinkedIn because they are unavailable under current permissions.
    pa = db.query(PostAnalytics).filter(
        PostAnalytics.post_id == post.id,
        PostAnalytics.platform == "linkedin"
    ).first()

    if not pa:
        pa = PostAnalytics(
            post_id=post.id,
            platform="linkedin",
            likes=likes if analytics_available else None,
            comments=comments if analytics_available else None,
            shares=shares if analytics_available else None,
            saves=None,
            reach=None,
            impressions=None,
            clicks=None,
            engagement_rate=None,
            analytics_available=analytics_available,
            error_reason=error_reason
        )
        db.add(pa)
    else:
        pa.likes = likes if analytics_available else None
        pa.comments = comments if analytics_available else None
        pa.shares = shares if analytics_available else None
        pa.saves = None
        pa.reach = None
        pa.impressions = None
        pa.clicks = None
        pa.engagement_rate = None
        pa.analytics_available = analytics_available
        pa.error_reason = error_reason

    # 5. Save to analytics_metrics table (so Insights router matches)
    am = db.query(AnalyticsMetric).filter(
        AnalyticsMetric.post_id == post.id,
        AnalyticsMetric.platform == "linkedin"
    ).first()

    if not am:
        am = AnalyticsMetric(
            post_id=post.id,
            platform="linkedin",
            reach=None,
            impressions=None,
            reactions=likes if analytics_available else None,
            comments=comments if analytics_available else None,
            shares=shares if analytics_available else None,
            analytics_available=analytics_available,
            error_reason=error_reason
        )
        db.add(am)
    else:
        am.reach = None
        am.impressions = None
        am.reactions = likes if analytics_available else None
        am.comments = comments if analytics_available else None
        am.shares = shares if analytics_available else None
        am.analytics_available = analytics_available
        am.error_reason = error_reason

    # 6. Update PlatformAnalytics (only if analytics succeeded)
    if analytics_available:
        plat_a = db.query(PlatformAnalytics).filter(
            PlatformAnalytics.platform == "linkedin"
        ).first()
        engagement_val = (likes or 0) + (comments or 0) + (shares or 0)
        if not plat_a:
            plat_a = PlatformAnalytics(
                platform="linkedin",
                followers=0,
                reach=0,
                engagement=engagement_val,
                impressions=0,
                clicks=0
            )
            db.add(plat_a)
        else:
            plat_a.engagement = engagement_val

    db.commit()
    logger.info("Synchronized LinkedIn analytics for post id=%s", post.id)


async def sync_all_linkedin_analytics(db: Session, user_id: int):
    """Sync all published LinkedIn posts belonging to the user."""
    posts = db.query(Post).filter(
        Post.owner_id == user_id,
        Post.status == "published"
    ).all()

    for post in posts:
        has_log = db.query(PublishingLog).filter(
            PublishingLog.post_id == post.id,
            PublishingLog.platform == "linkedin",
            PublishingLog.status == "published"
        ).first()
        if has_log:
            await sync_linkedin_post_analytics(db, post)
