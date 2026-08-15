import httpx
from typing import Dict, Any, Tuple
from urllib.parse import urlencode
import logging

from app.config import settings
from app.integrations.social.provider import SocialProvider

logger = logging.getLogger(__name__)


class FacebookProvider(SocialProvider):
    AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth"
    TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token"
    API_BASE_URL = "https://graph.facebook.com/v18.0"

    def __init__(self):
        self.client_id = settings.FACEBOOK_CLIENT_ID
        self.client_secret = settings.FACEBOOK_CLIENT_SECRET
        self.scopes = [
            "public_profile",
            "email",
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_posts",
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

        access_token = res_json.get("access_token")
        expires_in = res_json.get("expires_in", 0)

        long_lived_url = f"{self.TOKEN_URL}?grant_type=fb_exchange_token&client_id={self.client_id}&client_secret={self.client_secret}&fb_exchange_token={access_token}"
        try:
            ll_response = httpx.get(long_lived_url)
            if ll_response.status_code == 200:
                ll_data = ll_response.json()
                access_token = ll_data.get("access_token", access_token)
                expires_in = ll_data.get("expires_in", expires_in)
        except Exception as e:
            logger.warning(f"Could not get long-lived token: {e}")

        return access_token, "", expires_in

    def refresh_token(self, refresh_token: str) -> Tuple[str, str, int]:
        return "", "", 0

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        params = {"fields": "id,name,email", "access_token": access_token}
        response = httpx.get(f"{self.API_BASE_URL}/me", params=params)
        response.raise_for_status()
        me_data = response.json()

        return {
            "id": me_data.get("id"),
            "name": me_data.get("name"),
            "email": me_data.get("email"),
        }

    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        pages_resp = httpx.get(
            f"{self.API_BASE_URL}/me/accounts", params={"access_token": access_token}
        )
        pages_resp.raise_for_status()
        pages_data = pages_resp.json()

        pages = pages_data.get("data", [])
        if not pages:
            raise Exception("No Facebook Pages found for this user.")

        page = pages[0]
        page_id = page.get("id")
        page_token = page.get("access_token")

        post_data = {"message": content.get("text", ""), "access_token": page_token}
        media_paths = content.get("media_paths", [])

        if media_paths:
            path = media_paths[0]
            is_video = str(path).lower().endswith((".mp4", ".mov", ".avi"))
            endpoint = f"{self.API_BASE_URL}/{page_id}/{'videos' if is_video else 'photos'}"
            
            with open(path, "rb") as file_stream:
                files = {"source": file_stream}
                if is_video and "message" in post_data:
                    post_data["description"] = post_data.pop("message")
                response = httpx.post(endpoint, data=post_data, files=files)
                response.raise_for_status()
        else:
            endpoint = f"{self.API_BASE_URL}/{page_id}/feed"
            response = httpx.post(endpoint, data=post_data)
            response.raise_for_status()

        return response.json().get("id", "unknown-id")
