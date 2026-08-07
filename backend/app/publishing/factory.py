"""Factory for creating platform-specific publishing providers."""

from typing import Optional

from app.models.user import SocialAccount
from .base import BaseProvider


def get_provider(platform: str, access_token: str) -> Optional[BaseProvider]:
    """Get the appropriate provider for a platform.

    Args:
        platform: Platform name (linkedin, facebook, instagram, x, youtube, pinterest)
        access_token: Valid OAuth access token

    Returns:
        Provider instance or None if platform not supported yet
    """
    if platform == "linkedin":
        from .providers.linkedin import LinkedInProvider
        return LinkedInProvider(access_token)

    # Other platforms will be implemented in future phases
    return None
