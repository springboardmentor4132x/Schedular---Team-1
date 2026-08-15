import httpx
from typing import Dict, Any, Tuple
from urllib.parse import urlencode
import time
import logging

from app.config import settings
from app.integrations.social.provider import SocialProvider

logger = logging.getLogger(__name__)


class InstagramProvider(SocialProvider):
    # Instagram Graph API relies on Facebook Login
    AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth"
    TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token"
    API_BASE_URL = "https://graph.facebook.com/v18.0"

    def __init__(self):
        self.client_id = settings.INSTAGRAM_CLIENT_ID or settings.FACEBOOK_CLIENT_ID
        self.client_secret = (
            settings.INSTAGRAM_CLIENT_SECRET or settings.FACEBOOK_CLIENT_SECRET
        )
        self.scopes = [
            "instagram_basic",
            "instagram_content_publish",
            "pages_show_list",
            "pages_read_engagement",
        ]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": ",".join(self.scopes),
            "response_type": "code",
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    def exchange_code(self, code: str, redirect_uri: str) -> Tuple[str, str, int]:
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": redirect_uri,
            "code": code,
        }
        response = httpx.get(self.TOKEN_URL, params=data)
        response.raise_for_status()
        res_json = response.json()
        return res_json.get("access_token"), "", res_json.get("expires_in", 0)

    def refresh_token(self, refresh_token: str) -> Tuple[str, str, int]:
        return "", "", 0

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        # Fetch pages
        pages_resp = httpx.get(
            f"{self.API_BASE_URL}/me/accounts", params={"access_token": access_token}
        )
        pages_resp.raise_for_status()
        pages = pages_resp.json().get("data", [])

        if not pages:
            raise Exception("No Facebook Pages linked for Instagram.")

        page_id = pages[0].get("id")

        # Get Instagram Business Account ID
        ig_resp = httpx.get(
            f"{self.API_BASE_URL}/{page_id}",
            params={
                "fields": "instagram_business_account",
                "access_token": access_token,
            },
        )
        ig_resp.raise_for_status()
        ig_data = ig_resp.json()

        ig_account_id = ig_data.get("instagram_business_account", {}).get("id")
        if not ig_account_id:
            raise Exception("No Instagram Business Account connected to this Page.")

        return {"id": ig_account_id, "name": f"IG Account {ig_account_id}", "email": ""}

    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        # Instagram publishing is a 2-step process: Create media container, then publish it.
        # 1. Determine IG Account ID (again)
        pages_resp = httpx.get(
            f"{self.API_BASE_URL}/me/accounts", params={"access_token": access_token}
        )
        pages_resp.raise_for_status()
        pages = pages_resp.json().get("data", [])
        if not pages:
            raise Exception("No Facebook Pages found.")

        page_id = pages[0].get("id")
        ig_resp = httpx.get(
            f"{self.API_BASE_URL}/{page_id}",
            params={
                "fields": "instagram_business_account",
                "access_token": access_token,
            },
        )
        ig_account_id = ig_resp.json().get("instagram_business_account", {}).get("id")

        if not ig_account_id:
            raise Exception("No Instagram account found.")

        media_urls = content.get("mediaUrls", [])
        if not media_urls:
            raise Exception("Instagram requires media (image or video) to publish.")

        # 2. Create Container
        container_data = {
            "caption": content.get("text", ""),
            "access_token": access_token,
            "image_url": media_urls[0],  # Simplification for single image
        }

        # Determine if video
        if media_urls[0].endswith(".mp4"):
            container_data.pop("image_url")
            container_data["video_url"] = media_urls[0]
            container_data["media_type"] = "REELS"

        container_resp = httpx.post(
            f"{self.API_BASE_URL}/{ig_account_id}/media", data=container_data
        )
        container_resp.raise_for_status()
        creation_id = container_resp.json().get("id")

        # 3. If video, wait for status (simplified polling)
        if "video_url" in container_data:
            time.sleep(10)  # Minimal wait

        # 4. Publish Container
        publish_data = {"creation_id": creation_id, "access_token": access_token}
        publish_resp = httpx.post(
            f"{self.API_BASE_URL}/{ig_account_id}/media_publish", data=publish_data
        )
        publish_resp.raise_for_status()

        return publish_resp.json().get("id", "unknown-id")
