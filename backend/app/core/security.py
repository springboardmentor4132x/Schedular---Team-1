from cryptography.fernet import Fernet, InvalidToken
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def _token_cipher() -> Fernet:
    """Return the configured cipher or fail closed.

    Generating a transient key makes previously stored OAuth credentials
    undecipherable after a restart and creates a false sense of security.  A
    deployment must provide a valid, stable Fernet key before it can store a
    social token.
    """
    if not settings.ENCRYPTION_KEY:
        raise RuntimeError("ENCRYPTION_KEY is required before storing social tokens.")
    try:
        return Fernet(settings.ENCRYPTION_KEY.encode("utf-8"))
    except (TypeError, ValueError) as exc:
        raise RuntimeError("ENCRYPTION_KEY is not a valid Fernet key.") from exc


def encrypt_token(token: str) -> str:
    if not token:
        return token
    return _token_cipher().encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return encrypted_token
    try:
        return _token_cipher().decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError) as exc:
        # Do not log ciphertext or return a silently-empty credential.  Callers
        # can mark the account as requiring reconnection.
        logger.warning("Could not decrypt a stored social token.")
        raise RuntimeError("Stored social credentials can no longer be decrypted.") from exc


import sqlalchemy.types as types


class EncryptedType(types.TypeDecorator):
    """Transparently encrypt/decrypt strings in the database."""

    impl = types.Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return encrypt_token(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return decrypt_token(value)
        return value
