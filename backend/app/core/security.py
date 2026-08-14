from cryptography.fernet import Fernet
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Ensure the key is exactly 32 url-safe base64-encoded bytes.
try:
    _fernet = Fernet(settings.ENCRYPTION_KEY.encode('utf-8'))
except ValueError as e:
    logger.warning("Invalid ENCRYPTION_KEY format. Falling back to a random key for development.")
    _fernet = Fernet(Fernet.generate_key())

def encrypt_token(token: str) -> str:
    if not token:
        return token
    return _fernet.encrypt(token.encode('utf-8')).decode('utf-8')

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return encrypted_token
    try:
        return _fernet.decrypt(encrypted_token.encode('utf-8')).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to decrypt token: {e}")
        return ""

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
