import httpx
from typing import Dict, Any, Tuple
from urllib.parse import urlencode

from app.config import settings
from app.integrations.social.provider import SocialProvider

class LinkedInProvider(SocialProvider):
    AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
    TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    API_BASE_URL = "https://api.linkedin.com/v2"

    def __init__(self):
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.scopes = ["w_member_social", "r_liteprofile", "r_emailaddress"]

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": " ".join(self.scopes),
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    def exchange_code(self, code: str, redirect_uri: str) -> Tuple[str, str, int]:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": redirect_uri,
        }
        response = httpx.post(self.TOKEN_URL, data=data)
        response.raise_for_status()
        res_json = response.json()
        return res_json.get("access_token"), res_json.get("refresh_token", ""), res_json.get("expires_in", 0)

    def refresh_token(self, refresh_token: str) -> Tuple[str, str, int]:
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        response = httpx.post(self.TOKEN_URL, data=data)
        response.raise_for_status()
        res_json = response.json()
        return res_json.get("access_token"), res_json.get("refresh_token", ""), res_json.get("expires_in", 0)

    def get_account_info(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        # Fetch profile
        me_response = httpx.get(f"{self.API_BASE_URL}/me", headers=headers)
        me_response.raise_for_status()
        me_data = me_response.json()
        
        # Fetch email
        email_response = httpx.get(f"{self.API_BASE_URL}/emailAddress?q=members&projection=(elements*(handle~))", headers=headers)
        email_data = email_response.json() if email_response.status_code == 200 else {}
        email = email_data.get("elements", [{}])[0].get("handle~", {}).get("emailAddress")

        name = f"{me_data.get('localizedFirstName', '')} {me_data.get('localizedLastName', '')}".strip()
        return {
            "id": me_data.get("id"),
            "name": name,
            "email": email
        }

    def publish_post(self, access_token: str, content: Dict[str, Any]) -> str:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json"
        }
        
        # Retrieve URN (needs to be fetched from me endpoint or cached)
        # Assuming content contains author_urn, e.g. "urn:li:person:12345"
        author_urn = content.get("author_urn")
        
        # This is a simple UGC text post structure for LinkedIn
        data = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": content.get("text", "")
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }
        
        response = httpx.post(f"{self.API_BASE_URL}/ugcPosts", headers=headers, json=data)
        response.raise_for_status()
        
        # The ID is usually returned in the 'X-RestLi-Id' header
        return response.headers.get("X-RestLi-Id", "unknown-id")
