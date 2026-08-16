import tweepy
from pydantic import BaseModel
from typing import Optional

class PublishingResult(BaseModel):
    success: bool
    external_post_id: Optional[str] = None
    error_message: Optional[str] = None

class XProvider:
    def __init__(self, token: str):
        self.api_key = "YOUR_API_KEY"
        self.api_secret = "YOUR_API_SECRET"
        self.access_token = "YOUR_ACCESS_TOKEN"
        self.access_token_secret = "YOUR_ACCESS_TOKEN_SECRET"

    async def publish(self, post) -> PublishingResult:
        try:
            client = tweepy.Client(
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret
            )
            post_text = post.caption or "Scheduled via SocialPilot"
            response = client.create_tweet(text=post_text)
            
            return PublishingResult(success=True, external_post_id=str(response.data['id']))
            
        except tweepy.errors.TweepyException as e:
            return PublishingResult(success=False, error_message=f"X API Error: {str(e)}")
        except Exception as e:
            return PublishingResult(success=False, error_message=f"Unexpected error: {str(e)}")