"""Facebook publishing provider."""
import json
import mimetypes
from pathlib import Path

import httpx

from app.models.content import Post
from app.publishing.base import BaseProvider, PublishResult


class FacebookProvider(BaseProvider):
    """Provider for publishing posts to a Facebook Page."""

    GRAPH_API_BASE = "https://graph.facebook.com/v24.0"

    def __init__(self, access_token: str, page_id: str):
        super().__init__(access_token)
        self.page_id = page_id
    def _content_type(self, file_path: Path) -> str:
        content_type, _ = mimetypes.guess_type(file_path.name)
        return content_type or "application/octet-stream"

    def validate_content(self, post: Post) -> tuple[bool, str | None]:
        if not post.caption:
            return False, "Post caption is required for Facebook."

        return True, None

    async def publish(self, post: Post) -> PublishResult:
        is_valid, error_message = self.validate_content(post)

        if not is_valid:
            return PublishResult(
                success=False,
                error_message=error_message,
            )

        try:
            # -----------------------------------------
            # PHOTO POST
            # -----------------------------------------
            if post.media_urls:
                media_urls = post.media_urls

                # DB nunchi JSON string vaste list ga convert cheyyali
                if isinstance(media_urls, str):
                    try:
                        media_urls = json.loads(media_urls)
                    except json.JSONDecodeError:
                        media_urls = [media_urls]

                if not media_urls:
                    return PublishResult(
                        success=False,
                        error_message="No media URL found.",
                    )

                media_url = media_urls[0]

                relative_path = str(media_url).lstrip("/")

                # facebook.py location:
                # backend/app/publishing/providers/facebook.py
                # parents[3] = backend
                backend_dir = Path(__file__).resolve().parents[3]

                file_path = backend_dir / relative_path

                if not file_path.exists():
                    return PublishResult(
                        success=False,
                        error_message=f"Media file not found: {file_path}",
                    )

                url = f"{self.GRAPH_API_BASE}/{self.page_id}/photos"

                with file_path.open("rb") as image_file:
                    files = {
                        "source": (
                            file_path.name,
                            image_file,
                            self._content_type(file_path),
                        )
                    }

                    data = {
                        "message": post.caption or "",
                        "access_token": self.access_token,
                    }

                    async with httpx.AsyncClient(timeout=60) as client:
                        response = await client.post(
                            url,
                            data=data,
                            files=files,
                        )

                        response.raise_for_status()
                        result = response.json()

                post_id = result.get("post_id") or result.get("id")

                if not post_id:
                    return PublishResult(
                        success=False,
                        error_message=(
                            "Facebook API did not return a photo/post ID: "
                            f"{result}"
                        ),
                    )

                return PublishResult(
                    success=True,
                    external_post_id=post_id,
                )

            # -----------------------------------------
            # TEXT-ONLY POST
            # -----------------------------------------
            url = f"{self.GRAPH_API_BASE}/{self.page_id}/feed"

            payload = {
                "message": post.caption or "",
                "access_token": self.access_token,
            }

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    url,
                    data=payload,
                )

                response.raise_for_status()
                result = response.json()

            post_id = result.get("id")

            if not post_id:
                return PublishResult(
                    success=False,
                    error_message="Facebook API did not return a post ID.",
                )

            return PublishResult(
                success=True,
                external_post_id=post_id,
            )

        except httpx.HTTPStatusError as exc:
            return PublishResult(
                success=False,
                error_message=(
                    f"Facebook API error "
                    f"{exc.response.status_code}: "
                    f"{exc.response.text}"
                )[:2000],
            )

        except Exception as exc:
            return PublishResult(
                success=False,
                error_message=f"{type(exc).__name__}: {exc}"[:2000],
            )