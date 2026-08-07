"""LinkedIn publishing provider implementation."""

import json
import logging
import mimetypes
from pathlib import Path
from typing import Optional
import httpx
from fastapi import HTTPException

from app.models.content import Post
from app.publishing.base import BaseProvider, PublishResult

logger = logging.getLogger(__name__)

# Uploaded media lives on disk under backend/uploads and is referenced in the
# database as "/uploads/<storage_key>". Resolve to the same directory the
# content router writes to (backend/uploads).
UPLOAD_DIRECTORY = Path(__file__).resolve().parents[3] / "uploads"


class LinkedInProvider(BaseProvider):
    """Provider for publishing to LinkedIn."""

    LINKEDIN_API_BASE = "https://api.linkedin.com/v2"

    async def publish(self, post: Post) -> PublishResult:
        """Publish a post to LinkedIn.

        Args:
            post: Post object with caption and optional media

        Returns:
            PublishResult with success status and LinkedIn post URN or error
        """
        # Validate content first
        is_valid, error_msg = self.validate_content(post)
        if not is_valid:
            return PublishResult(success=False, error_message=error_msg)

        logger.info(
            "LinkedInProvider.publish starting for post id=%s (media=%s)",
            post.id,
            bool(post.media_urls and post.media_urls != "[]"),
        )

        try:
            # Get user profile URN (needed as author)
            profile_urn = await self._get_profile_urn()
            if not profile_urn:
                return PublishResult(
                    success=False,
                    error_message="Failed to retrieve LinkedIn profile"
                )

            # Parse media URLs if present
            media_urls = []
            if post.media_urls:
                try:
                    media_urls = (
                        json.loads(post.media_urls)
                        if isinstance(post.media_urls, str)
                        else post.media_urls
                    )
                except (json.JSONDecodeError, TypeError):
                    media_urls = []

            # Create LinkedIn post
            if media_urls:
                # Post with media (image or video)
                post_urn = await self._create_media_post(
                    profile_urn, post.caption, media_urls
                )
            else:
                # Text-only post
                post_urn = await self._create_text_post(profile_urn, post.caption)

            logger.info(
                "LinkedInProvider.publish succeeded for post id=%s urn=%s",
                post.id,
                post_urn,
            )
            return PublishResult(success=True, external_post_id=post_urn)

        except httpx.HTTPStatusError as exc:
            # Preserve the exact LinkedIn HTTP status and full response body so
            # the real cause survives into Publishing Logs and Failed Posts.
            status_code = exc.response.status_code if exc.response is not None else "unknown"
            body = exc.response.text if exc.response is not None else str(exc)
            endpoint = str(exc.request.url) if exc.request is not None else "unknown"
            logger.error(
                "LinkedIn API request failed for post id=%s: status=%s endpoint=%s body=%s",
                post.id,
                status_code,
                endpoint,
                body,
            )
            return PublishResult(
                success=False,
                error_message=f"LinkedIn API error {status_code} at {endpoint}: {body}"[:2000],
            )
        except Exception as exc:
            # Keep the real exception type and message; never collapse to a
            # generic "Unknown error".
            logger.exception(
                "LinkedIn publishing failed for post id=%s", post.id
            )
            return PublishResult(
                success=False,
                error_message=f"{type(exc).__name__}: {exc}"[:2000],
            )

    def validate_content(self, post: Post) -> tuple[bool, Optional[str]]:
        """Validate post content against LinkedIn requirements.

        Args:
            post: Post object to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not post.caption:
            return False, "Post caption is required for LinkedIn"

        # LinkedIn text posts can have up to 3000 characters
        if len(post.caption) > 3000:
            return False, "LinkedIn post text exceeds 3000 character limit"

        return True, None

    async def _get_profile_urn(self) -> Optional[str]:
        """Get the authenticated user's LinkedIn profile URN.

        Returns:
            Profile URN string (e.g., 'urn:li:person:abc123') or None
        """
        url = f"{self.LINKEDIN_API_BASE}/userinfo"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        logger.info("LinkedIn calling endpoint: GET %s", url)
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            # LinkedIn userinfo returns 'sub' field with the profile ID
            sub = data.get("sub")
            if sub:
                return f"urn:li:person:{sub}"
            return None

    async def _create_text_post(
        self, author_urn: str, text: str
    ) -> str:
        """Create a text-only post on LinkedIn.

        Args:
            author_urn: URN of the post author
            text: Post text content

        Returns:
            LinkedIn post URN
        """
        url = f"{self.LINKEDIN_API_BASE}/ugcPosts"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }

        logger.info("LinkedIn calling endpoint: POST %s (text share)", url)
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()

            # ugcPosts returns 201 Created; the created post URN is in the
            # X-RestLi-Id response header (not the JSON body).
            post_id = response.headers.get("x-restli-id")

            # Fallback: some responses also echo the id in the body.
            if not post_id:
                try:
                    post_id = response.json().get("id")
                except (json.JSONDecodeError, ValueError):
                    post_id = None

            if not post_id:
                raise HTTPException(
                    status_code=500,
                    detail="LinkedIn API did not return post ID"
                )

            return post_id

    async def _create_media_post(
        self, author_urn: str, text: str, media_urls: list[str]
    ) -> str:
        """Create a post with an image on LinkedIn.

        Implements the official LinkedIn image share flow:
        1. Register the upload (assets?action=registerUpload) to get an
           uploadUrl and asset URN.
        2. Upload the image binary to the returned uploadUrl.
        3. Create the ugcPost referencing the asset URN with
           shareMediaCategory=IMAGE.

        Args:
            author_urn: URN of the post author
            text: Post text content
            media_urls: List of media URLs (only images supported here)

        Returns:
            LinkedIn post URN
        """
        # Upload each referenced image and collect its asset URN. Only images
        # are supported in this flow; unsupported entries are skipped.
        media_entries: list[dict] = []
        for media_url in media_urls:
            image_bytes, content_type = self._read_media(media_url)
            if image_bytes is None or not content_type.startswith("image/"):
                # Skip anything we cannot resolve or that is not an image.
                continue
            asset_urn = await self._register_and_upload_image(author_urn, image_bytes)
            media_entries.append(
                {
                    "status": "READY",
                    "media": asset_urn,
                    "title": {"text": ""},
                }
            )

        # If no image could be uploaded, fall back to a text-only post so the
        # caption is still published rather than failing outright.
        if not media_entries:
            return await self._create_text_post(author_urn, text)

        url = f"{self.LINKEDIN_API_BASE}/ugcPosts"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": text},
                    "shareMediaCategory": "IMAGE",
                    "media": media_entries,
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }

        logger.info("LinkedIn calling endpoint: POST %s (image share)", url)
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()

            post_id = response.headers.get("x-restli-id")
            if not post_id:
                try:
                    post_id = response.json().get("id")
                except (json.JSONDecodeError, ValueError):
                    post_id = None

            if not post_id:
                raise HTTPException(
                    status_code=500,
                    detail="LinkedIn API did not return post ID",
                )

            return post_id

    async def _register_and_upload_image(
        self, author_urn: str, image_bytes: bytes
    ) -> str:
        """Register an image upload and push the binary to LinkedIn.

        Args:
            author_urn: URN of the owning member
            image_bytes: Raw image binary

        Returns:
            The asset URN (e.g. 'urn:li:digitalmediaAsset:...') to attach to a post
        """
        register_url = f"{self.LINKEDIN_API_BASE}/assets?action=registerUpload"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }
        register_body = {
            "registerUploadRequest": {
                "owner": author_urn,
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "serviceRelationships": [
                    {
                        "identifier": "urn:li:userGeneratedContent",
                        "relationshipType": "OWNER",
                    }
                ],
                "supportedUploadMechanism": ["SYNCHRONOUS_UPLOAD"],
            }
        }

        async with httpx.AsyncClient() as client:
            logger.info("LinkedIn calling endpoint: POST %s (registerUpload)", register_url)
            register_response = await client.post(
                register_url, json=register_body, headers=headers
            )
            register_response.raise_for_status()
            register_data = register_response.json().get("value", {})

            asset_urn = register_data.get("asset")
            upload_mechanism = (
                register_data.get("uploadMechanism", {}).get(
                    "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest", {}
                )
            )
            upload_url = upload_mechanism.get("uploadUrl")

            if not asset_urn or not upload_url:
                raise HTTPException(
                    status_code=500,
                    detail="LinkedIn registerUpload did not return an upload URL or asset",
                )

            # Step 2: upload the raw image binary to the returned uploadUrl.
            logger.info("LinkedIn calling endpoint: POST %s (binary upload)", upload_url)
            upload_response = await client.post(
                upload_url,
                content=image_bytes,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/octet-stream",
                },
            )
            upload_response.raise_for_status()
            logger.info("LinkedIn image upload complete, asset=%s", asset_urn)

        return asset_urn

    def _read_media(self, media_url: str) -> tuple[Optional[bytes], str]:
        """Resolve a stored media reference to its bytes and content type.

        Media is stored on disk under backend/uploads and referenced in the
        database as '/uploads/<storage_key>'. Only local upload references are
        resolved; anything else returns (None, "").

        Args:
            media_url: Media reference such as '/uploads/<storage_key>'

        Returns:
            Tuple of (image bytes or None, content type string)
        """
        if not media_url.startswith("/uploads/"):
            return None, ""

        storage_key = media_url.removeprefix("/uploads/")
        file_path = UPLOAD_DIRECTORY / storage_key
        if not file_path.is_file():
            return None, ""

        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        return file_path.read_bytes(), content_type
