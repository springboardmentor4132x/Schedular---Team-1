import re

with open('app/routers/dashboard.py', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'        "history": \[\],\n    \}\n.*?    code: str \| None = Query\(default=None\),', re.DOTALL)

correct = '''        "history": [],
    }


@router.post("/social/connect/{platform}")
def connect_social_account(
    platform: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    _validate_platform(platform)
    try:
        client_id, _ = _oauth_configuration(platform)
    except HTTPException:
        # Strict production enforcement: Do not fall back to local demo providers.
        raise HTTPException(
            status_code=501,
            detail=f"{platform.title()} OAuth credentials are not configured on this server.",
        )
    code_verifier = secrets.token_urlsafe(64) if platform == "x" else None
    state = _oauth_state(user.id, platform, code_verifier)
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": _callback_url(platform),
        "state": state,
    }
    if platform == "linkedin":
        endpoint, params["scope"] = (
            "https://www.linkedin.com/oauth/v2/authorization",
            "openid profile email w_member_social",
        )
    elif platform == "youtube":
        endpoint = "https://accounts.google.com/o/oauth2/v2/auth"
        params.update(
            {
                "scope": "openid email profile https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
                "access_type": "offline",
                "prompt": "consent",
            }
        )
    elif platform == "x":
        endpoint = "https://x.com/i/oauth2/authorize"
        challenge = (
            base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest())
            .decode()
            .rstrip("=")
        )
        params.update(
            {
                "scope": "tweet.read tweet.write users.read offline.access",
                "code_challenge": challenge,
                "code_challenge_method": "S256",
            }
        )
    elif platform == "facebook":
        endpoint, params["scope"] = (
            "https://www.facebook.com/v24.0/dialog/oauth",
            "public_profile,email,pages_show_list,pages_read_engagement",
        )
    elif platform == "instagram":
        endpoint, params["scope"] = (
            "https://www.instagram.com/oauth/authorize",
            "instagram_business_basic,instagram_business_content_publish",
        )
    else:
        endpoint, params["scope"] = (
            "https://www.pinterest.com/oauth/",
            "boards:read,pins:read,pins:write,user_accounts:read",
        )
    authorization_url = f"{endpoint}?{urlencode(params)}"
    return {
        "success": True,
        "message": "Continue with the social provider to connect the account.",
        "authorizationUrl": authorization_url,
    }


@router.get("/social/callback/{platform}")
def social_oauth_callback(
    platform: str,
    code: str | None = Query(default=None),'''

new_content, count = pattern.subn(correct, content)
if count > 0:
    with open('app/routers/dashboard.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Fixed successfully!')
else:
    print('Could not match pattern.')
