from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple

class SocialProvider(ABC):
    @abstractmethod
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """Return the URL where the user should be redirected to authorize."""
        pass

    @abstractmethod
    def exchange_code(self, code: str, redirect_uri: str) -> Tuple[str, str, int]:
        """Exchange the authorization code for an access token and refresh token.
        
        Returns:
            Tuple[str, str, int]: (access_token, refresh_token, expires_in_seconds)
        """
        pass

    @abstractmethod
    def refresh_token(self, refresh_token: str) -> Tuple[str, str, int]:
        """Refresh an expired access token."""
        pass

    @abstractmethod
    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        """Get information about the connected account (name, id, email)."""
        pass

    @abstractmethod
    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        """Publish a post to the social platform.
        
        Returns:
            str: The external post ID.
        """
        pass
