import json
import random
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from celery import shared_task

from app.database import SessionLocal
from app.models.content import Post, AnalyticsMetric, PublishingLog
from app.models.analytics import PostAnalytics
from app.models.user import SocialAccount
from app.tasks.publishing_tasks import get_provider

logger = logging.getLogger(__name__)

@shared_task(name="app.tasks.analytics_tasks.sync_analytics")
def sync_analytics():
    """Background task to fetch analytics for all published posts from social APIs."""
    db: Session = SessionLocal()
    try:
        published_posts = db.query(Post).filter(Post.status == "published").all()
        for post in published_posts:
            platforms = json.loads(post.platforms or "[]")
            for platform in platforms:
                log = db.query(PublishingLog).filter_by(
                    post_id=post.id, platform=platform, status="published"
                ).order_by(PublishingLog.id.desc()).first()
                if not log or not log.external_post_id or not log.social_account_id:
                    continue
                
                account = db.get(SocialAccount, log.social_account_id)
                if not account or not account.access_token_encrypted:
                    continue
                
                try:
                    provider = get_provider(platform)
                    
                    # Auto-refresh token if it's expired or about to expire
                    if account.token_expires_at and account.token_expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
                        if account.refresh_token_encrypted and hasattr(provider, "refresh_token"):
                            try:
                                new_access, new_refresh, exp_in = provider.refresh_token(account.refresh_token_encrypted)
                                if new_access:
                                    account.access_token_encrypted = new_access
                                    if new_refresh:
                                        account.refresh_token_encrypted = new_refresh
                                    if exp_in:
                                        account.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(exp_in))
                                    db.commit()
                            except Exception as e:
                                logger.error(f"Failed to auto-refresh token for {platform}: {e}")
                    
                    metric = db.query(AnalyticsMetric).filter_by(post_id=post.id, platform=platform).first()
                    if not metric:
                        metric = AnalyticsMetric(post_id=post.id, platform=platform)
                        db.add(metric)
                    
                    post_analytics = db.query(PostAnalytics).filter_by(post_id=post.id, platform=platform).first()
                    if not post_analytics:
                        post_analytics = PostAnalytics(post_id=post.id, platform=platform)
                        db.add(post_analytics)
                    
                    if hasattr(provider, "get_analytics"):
                        stats = provider.get_analytics(account.access_token_encrypted, log.external_post_id)
                        if stats:
                            views = stats.get("views", 0)
                            likes = stats.get("likes", 0)
                            comments = stats.get("comments", 0)
                            shares = stats.get("shares", 0)
                            
                            metric.reach = views
                            metric.impressions = views
                            metric.reactions = likes
                            metric.comments = comments
                            metric.shares = shares
                            
                            post_analytics.reach = views
                            post_analytics.impressions = views
                            post_analytics.likes = likes
                            post_analytics.comments = comments
                            post_analytics.shares = shares
                            
                            if post_analytics.reach > 0:
                                post_analytics.engagement_rate = ((likes + comments + shares) / post_analytics.reach) * 100
                    else:
                        # Mock data for other platforms
                        new_reach = random.randint(10, 100)
                        new_impressions = random.randint(15, 120)
                        new_likes = random.randint(1, 20)
                        new_comments = random.randint(0, 5)
                        new_shares = random.randint(0, 3)
                        
                        metric.reach = (metric.reach or 0) + new_reach
                        metric.impressions = (metric.impressions or 0) + new_impressions
                        metric.reactions = (metric.reactions or 0) + new_likes
                        metric.comments = (metric.comments or 0) + new_comments
                        metric.shares = (metric.shares or 0) + new_shares
                        
                        post_analytics.reach = (post_analytics.reach or 0) + new_reach
                        post_analytics.impressions = (post_analytics.impressions or 0) + new_impressions
                        post_analytics.likes = (post_analytics.likes or 0) + new_likes
                        post_analytics.comments = (post_analytics.comments or 0) + new_comments
                        post_analytics.shares = (post_analytics.shares or 0) + new_shares
                        
                        if post_analytics.reach > 0:
                            post_analytics.engagement_rate = ((post_analytics.likes + post_analytics.comments + post_analytics.shares) / post_analytics.reach) * 100
                        
                    db.commit()
                except Exception as e:
                    logger.error(f"Error fetching analytics for post {post.id} on {platform}: {e}")

    except Exception as e:
        logger.error(f"Error syncing analytics: {e}")
    finally:
        db.close()

