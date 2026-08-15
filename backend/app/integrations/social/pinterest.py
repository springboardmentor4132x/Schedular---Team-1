import httpx
from typing import Dict, Any, Tuple
from urllib.parse import urlencode
import base64
import logging

from app.config import settings
from app.integrations.social.provider import SocialProvider

logger = logging.getLogger(__name__)


class PinterestProvider(SocialProvider):
    AUTH_URL = "https://www.pinterest.com/oauth/"
    TOKEN_URL = "https://api.pinterest.com/v5/oauth/token"
    API_BASE_URL = "https://api.pinterest.com/v5"

    def __init__(self):
        self.client_id = settings.PINTEREST_CLIENT_ID
        self.client_secret = settings.PINTEREST_CLIENT_SECRET
        self.scopes = [
            "boards:read",
            "boards:write",
            "pins:read",
            "pins:write",
            "user_accounts:read",
        ]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": ",".join(self.scopes),
            "state": state,
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
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
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
        data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
        response = httpx.post(self.TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        res_json = response.json()
        return (
            res_json.get("access_token"),
            res_json.get("refresh_token", refresh_token),
            res_json.get("expires_in", 0),
        )

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = httpx.get(f"{self.API_BASE_URL}/user_account", headers=headers)
        response.raise_for_status()
        data = response.json()

        return {
            "id": data.get(
                "account_type"
            ),  # Pinterest v5 doesn't easily return a consistent user ID in this endpoint sometimes
            "name": data.get("username"),
            "email": "",
        }

    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        # Get user boards to pick one
        boards_resp = httpx.get(f"{self.API_BASE_URL}/boards", headers=headers)
        boards_resp.raise_for_status()
        boards = boards_resp.json().get("items", [])

        if not boards:
            raise Exception("No Pinterest boards found. Create a board first.")

        board_id = boards[0].get("id")

        import mimetypes

        media_paths = content.get("media_paths", [])
        if not media_paths:
            raise Exception("Pinterest requires an image file.")

        path = media_paths[0]
        content_type = mimetypes.guess_type(path)[0] or "image/jpeg"
        
        with open(path, "rb") as f:
            file_data = f.read()
            b64_data = base64.b64encode(file_data).decode('utf-8')

        data = {
            "board_id": board_id,
            "title": content.get("title", ""),
            "description": content.get("text", ""),
            "media_source": {
                "source_type": "image_base64", 
                "content_type": content_type,
                "data": b64_data
            },
        }

        response = httpx.post(f"{self.API_BASE_URL}/pins", headers=headers, json=data)
        response.raise_for_status()

        return response.json().get("id", "unknown-id")
