"""Factory for creating platform-specific publishing providers."""

from typing import Optional

from .base import BaseProvider


def get_provider(
    platform: str,
    access_token: str,
    page_id: str | None = None,
) -> Optional[BaseProvider]:
    """Get the appropriate provider for a platform."""

    if platform == "linkedin":
        from .providers.linkedin import LinkedInProvider

        return LinkedInProvider(access_token)

    if platform == "facebook":
        from .providers.facebook import FacebookProvider

        if not page_id:
            return None

        return FacebookProvider(
            access_token=access_token,
            page_id=page_id,
        )

    # Other platforms will be implemented in future phases
    return None