import httpx
from typing import Dict, Any, Tuple
from urllib.parse import urlencode
import logging
import base64

from app.config import settings
from app.integrations.social.provider import SocialProvider

logger = logging.getLogger(__name__)


class XProvider(SocialProvider):
    # Using OAuth 2.0 with PKCE for Twitter (X) API v2
    AUTH_URL = "https://twitter.com/i/oauth2/authorize"
    TOKEN_URL = "https://api.twitter.com/2/oauth2/token"
    API_BASE_URL = "https://api.twitter.com/2"

    def __init__(self):
        self.client_id = settings.X_CLIENT_ID
        self.client_secret = settings.X_CLIENT_SECRET
        self.scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        # Note: In a real implementation with PKCE, we should also generate and store a code_verifier
        # and send a code_challenge. We simplify this for the adapter skeleton.
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            "code_challenge": "challenge",  # Should be generated
            "code_challenge_method": "plain",
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    def exchange_code(self, code: str, redirect_uri: str) -> Tuple[str, str, int]:
        auth_string = f"{self.client_id}:{self.client_secret}"
        b64_auth = base64.b64encode(auth_string.encode()).decode()

        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "code": code,
            "grant_type": "authorization_code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "code_verifier": "challenge",  # Must match challenge in auth url
        }

        response = httpx.post(self.TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        res_json = response.json()

        return (
            res_json.get("access_token"),
            res_json.get("refresh_token", ""),
            res_json.get("expires_in", 0),
        )

    def refresh_token(self, refresh_token: str) -> Tuple[str, str, int]:
        auth_string = f"{self.client_id}:{self.client_secret}"
        b64_auth = base64.b64encode(auth_string.encode()).decode()

        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
            "client_id": self.client_id,
        }
        response = httpx.post(self.TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        res_json = response.json()
        return (
            res_json.get("access_token"),
            res_json.get("refresh_token", ""),
            res_json.get("expires_in", 0),
        )

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = httpx.get(f"{self.API_BASE_URL}/users/me", headers=headers)
        response.raise_for_status()
        data = response.json().get("data", {})

        return {
            "id": data.get("id"),
            "name": data.get("name"),
            "email": data.get("username"),  # X doesn't reliably give email
        }

    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        media_urls = content.get("mediaUrls", [])
        media_ids = []

        if media_urls:
            # Upload media to Twitter v1.1 media upload endpoint
            for media_url in media_urls:
                try:
                    img_resp = httpx.get(media_url, timeout=20)
                    img_resp.raise_for_status()

                    files = {"media": img_resp.content}
                    upload_headers = {"Authorization": f"Bearer {access_token}"}
                    upload_resp = httpx.post(
                        "https://upload.twitter.com/1.1/media/upload.json",
                        headers=upload_headers,
                        files=files,
                        timeout=30
                    )
                    upload_resp.raise_for_status()
                    media_id = upload_resp.json().get("media_id_string")
                    if media_id:
                        media_ids.append(media_id)
                except Exception as e:
                    logger.error(f"Failed to upload media to X: {e}")
                    raise ValueError(f"Failed to upload media to X: {str(e)}")

        data = {"text": content.get("text", "")}
        if media_ids:
            data["media"] = {"media_ids": media_ids}

        response = httpx.post(f"{self.API_BASE_URL}/tweets", headers=headers, json=data, timeout=30)
        response.raise_for_status()

        return response.json().get("data", {}).get("id", "unknown-id")
