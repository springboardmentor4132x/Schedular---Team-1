"""LinkedIn OAuth and Posts API adapter."""

from __future__ import annotations

from typing import Any, Dict, Tuple
from urllib.parse import urlencode

import httpx

from app.config import settings
from app.integrations.social.provider import SocialProvider


class LinkedInProvider(SocialProvider):
    AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
    TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    API_BASE_URL = "https://api.linkedin.com"

    def __init__(self):
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.scopes = ["openid", "profile", "email", "w_member_social"]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        return f"{self.AUTH_URL}?{urlencode({'response_type': 'code', 'client_id': self.client_id, 'redirect_uri': redirect_uri, 'state': state, 'scope': ' '.join(self.scopes)})}"

    def exchange_code(self, code: str, redirect_uri: str) -> Tuple[str, str, int]:
        response = httpx.post(
            self.TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": redirect_uri,
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("access_token"), payload.get("refresh_token", ""), payload.get("expires_in", 0)

    def refresh_token(self, refresh_token: str) -> Tuple[str, str, int]:
        raise ValueError("LinkedIn tokens must be reconnected when they expire for this integration.")

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        response = httpx.get(
            f"{self.API_BASE_URL}/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        return {
            "id": data.get("sub"),
            "name": data.get("name"),
            "email": data.get("email"),
        }

    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        author = content.get("author_urn")
        if not author:
            raise ValueError("A LinkedIn member or organization URN must be selected before publishing.")
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Linkedin-Version": "202603",
            "Content-Type": "application/json",
        }

        media_urls = content.get("mediaUrls", [])
        content_entities = []

        if media_urls:
            # For each media url, download the content, register upload with LinkedIn, upload the bytes.
            for idx, media_url in enumerate(media_urls):
                try:
                    # 1. Download image
                    img_resp = httpx.get(media_url, timeout=20)
                    img_resp.raise_for_status()
                    image_bytes = img_resp.content

                    # 2. Register upload
                    init_payload = {
                        "initializeUploadRequest": {
                            "owner": author
                        }
                    }
                    init_resp = httpx.post(f"{self.API_BASE_URL}/rest/images?action=initializeUpload", headers=headers, json=init_payload, timeout=20)
                    init_resp.raise_for_status()
                    init_data = init_resp.json()
                    
                    upload_url = init_data.get("value", {}).get("uploadUrl")
                    image_urn = init_data.get("value", {}).get("image")
                    
                    if not upload_url or not image_urn:
                        raise ValueError("Failed to get upload URL or image URN from LinkedIn.")

                    # 3. Upload the image bytes
                    upload_headers = {"Authorization": f"Bearer {access_token}"}
                    put_resp = httpx.put(upload_url, headers=upload_headers, content=image_bytes, timeout=30)
                    put_resp.raise_for_status()

                    content_entities.append({"entity": image_urn})
                except Exception as e:
                    logger.error(f"Failed to upload media to LinkedIn: {e}")
                    raise ValueError(f"Failed to upload media to LinkedIn: {str(e)}")

        payload = {
            "author": author,
            "commentary": content.get("text", ""),
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": [],
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False,
        }

        if content_entities:
            payload["content"] = {
                "media": {
                    "id": content_entities[0]["entity"] # Currently only taking the first one
                }
            }

        response = httpx.post(f"{self.API_BASE_URL}/rest/posts", headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        post_id = response.headers.get("x-restli-id") or response.headers.get("X-RestLi-Id")
        if not post_id:
            raise ValueError("LinkedIn did not return a post ID.")
        return str(post_id)
