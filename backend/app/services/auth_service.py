import bcrypt
import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 30
security = HTTPBearer(
    auto_error=False,
    bearerFormat="JWT",
    description="Paste the access_token value only. Swagger adds the Bearer prefix automatically.",
)

# NOTE: We use the `bcrypt` library directly instead of passlib's CryptContext.
# passlib (last released 2020) is unmaintained and its bcrypt backend crashes
# on bcrypt>=4.1 because it probes for an internal `__about__.__version__`
# attribute that newer bcrypt no longer exposes. Calling bcrypt directly
# sidesteps that broken compatibility shim entirely.

def _prepare(password: str) -> bytes:
    """Pre-hash passwords so bcrypt never silently truncates them.

    The application historically used bcrypt's first-72-byte behaviour.  The
    verifier still accepts that legacy representation so existing users can log
    in, while newly written hashes use this fixed-length input.
    """
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def verify_password(plain_password: str, hashed_password: str) -> bool:
    encoded = hashed_password.encode("utf-8")
    if bcrypt.checkpw(_prepare(plain_password), encoded):
        return True
    # Backwards-compatible check for records created before password pre-hash.
    return bcrypt.checkpw(plain_password.encode("utf-8")[:72], encoded)


def get_password_hash(password: str) -> str:
    hashed = bcrypt.hashpw(_prepare(password), bcrypt.gensalt())
    return hashed.decode("utf-8")


def create_access_token(data: dict):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"iat": now, "exp": expire, "type": "access", "jti": secrets.token_urlsafe(24)})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            **data,
            "iat": now,
            "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            "type": "refresh",
            "jti": secrets.token_urlsafe(24),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the bearer token used by the UI."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token. Log in and send Authorization: Bearer <access_token>.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials.strip()
    # Be forgiving when a user pastes "Bearer <token>" into Swagger, which
    # already adds its own Bearer prefix.
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub") if payload.get("type") == "access" else None
    except JWTError:
        email = None
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token. Log in again and use the new access_token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The user for this access token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("sv") != user.session_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This session has been signed out. Log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*allowed_roles: str):
    """Enforce that the authenticated user possesses one of the allowed roles."""
    def role_dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{user.role}' is not authorized to access this resource.",
            )
        return user
    return role_dependency


require_admin = require_roles("Administrator")
