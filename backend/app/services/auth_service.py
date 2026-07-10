import bcrypt
from datetime import datetime, timedelta
from jose import jwt

from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
