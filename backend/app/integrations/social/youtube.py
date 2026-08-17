"""YouTube OAuth and real resumable video-upload adapter."""

from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Any, Dict, Tuple
from urllib.parse import urlencode

import httpx

from app.config import settings
from app.integrations.social.provider import SocialProvider


class YouTubeProvider(SocialProvider):
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    API_BASE_URL = "https://www.googleapis.com/youtube/v3"
    UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"

    def __init__(self):
        self.client_id = settings.YOUTUBE_CLIENT_ID
        self.client_secret = settings.YOUTUBE_CLIENT_SECRET
        self.scopes = [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        return f"{self.AUTH_URL}?{urlencode({'client_id': self.client_id, 'redirect_uri': redirect_uri, 'response_type': 'code', 'scope': ' '.join(self.scopes), 'state': state, 'access_type': 'offline', 'prompt': 'consent'})}"

    def exchange_code(self, code: str, redirect_uri: str) -> Tuple[str, str, int]:
        response = httpx.post(
            self.TOKEN_URL,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("access_token"), payload.get("refresh_token", ""), payload.get("expires_in", 0)

    def refresh_token(self, refresh_token: str) -> Tuple[str, str, int]:
        response = httpx.post(
            self.TOKEN_URL,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        return payload.get("access_token"), payload.get("refresh_token", refresh_token), payload.get("expires_in", 0)

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        with httpx.Client(timeout=20) as client:
            profile = client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers=headers)
            profile.raise_for_status()
            channels = client.get(
                f"{self.API_BASE_URL}/channels",
                params={"part": "snippet", "mine": "true"},
                headers=headers,
            )
            channels.raise_for_status()
        channel = channels.json().get("items", [{}])[0]
        return {
            "id": channel.get("id"),
            "name": channel.get("snippet", {}).get("title", profile.json().get("name")),
            "email": profile.json().get("email"),
        }

    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        paths = [Path(value) for value in content.get("media_paths", [])]
        if len(paths) != 1 or not paths[0].is_file():
            raise ValueError("YouTube publishing requires exactly one uploaded local video file.")
        video_path = paths[0]
        content_type = mimetypes.guess_type(video_path.name)[0] or "application/octet-stream"
        if not content_type.startswith("video/"):
            raise ValueError("YouTube publishing requires a video MIME type.")

        options = content.get("platform_options", {}).get("youtube", {})
        metadata = {
            "snippet": {
                "title": str(options.get("title") or content.get("title") or "SocialPilot video")[:100],
                "description": str(options.get("description") or content.get("text") or ""),
                "categoryId": str(options.get("category_id") or "22"),
            },
            # Defaulting to public for easier visibility, can be overridden in platform options.
            "status": {"privacyStatus": options.get("privacy_status", "public")},
        }
        file_size = video_path.stat().st_size
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Length": str(file_size),
            "X-Upload-Content-Type": content_type,
        }
        with httpx.Client(timeout=httpx.Timeout(180.0, connect=20.0)) as client:
            initiated = client.post(
                self.UPLOAD_URL,
                params={"uploadType": "resumable", "part": "snippet,status"},
                headers=headers,
                json=metadata,
            )
            initiated.raise_for_status()
            upload_url = initiated.headers.get("Location")
            if not upload_url:
                raise ValueError("YouTube did not return a resumable upload URL.")
            with video_path.open("rb") as stream:
                uploaded = client.put(
                    upload_url,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": content_type,
                        "Content-Length": str(file_size),
                    },
                    content=stream,
                )
            uploaded.raise_for_status()
        video_id = uploaded.json().get("id")
        if not video_id:
            raise ValueError("YouTube upload completed without returning a video ID.")
        return str(video_id)

    def get_analytics(self, access_token: str, external_post_id: str) -> Dict[str, int]:
        headers = {"Authorization": f"Bearer {access_token}"}
        with httpx.Client(timeout=20) as client:
            response = client.get(
                f"{self.API_BASE_URL}/videos",
                params={"part": "statistics", "id": external_post_id},
                headers=headers,
            )
            response.raise_for_status()
            items = response.json().get("items", [])
            if not items:
                return {"views": 0, "likes": 0, "comments": 0}
            stats = items[0].get("statistics", {})
            return {
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
            }
