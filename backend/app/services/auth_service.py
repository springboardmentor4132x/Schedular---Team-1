import bcrypt
import hashlib
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

# bcrypt has a hard 72-byte input limit; truncate defensively so long
# passwords don't raise instead of just being (safely) capped.
_BCRYPT_MAX_BYTES = 72


def _prepare(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(_prepare(plain_password), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    hashed = bcrypt.hashpw(_prepare(password), bcrypt.gensalt())
    return hashed.decode("utf-8")


def create_access_token(data: dict):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"iat": now, "exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    now = datetime.now(timezone.utc)
    return jwt.encode({**data, "iat": now, "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), "type": "refresh"}, SECRET_KEY, algorithm=ALGORITHM)


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
        email = payload.get("sub")
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
    return user
