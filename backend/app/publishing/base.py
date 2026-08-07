"""Base provider interface for social media publishing."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from app.models.content import Post


@dataclass
class PublishResult:
    """Result of a publishing operation."""
    success: bool
    external_post_id: Optional[str] = None
    error_message: Optional[str] = None


class BaseProvider(ABC):
    """Abstract base class for social media platform providers."""

    def __init__(self, access_token: str):
        """Initialize provider with access token.

        Args:
            access_token: Valid OAuth access token for the platform
        """
        self.access_token = access_token

    @abstractmethod
    async def publish(self, post: Post) -> PublishResult:
        """Publish a post to the platform.

        Args:
            post: Post object containing caption, media_urls, etc.

        Returns:
            PublishResult with success status and external post ID or error
        """
        pass

    @abstractmethod
    def validate_content(self, post: Post) -> tuple[bool, Optional[str]]:
        """Validate post content against platform requirements.

        Args:
            post: Post object to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        pass
