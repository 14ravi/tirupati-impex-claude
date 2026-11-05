import logging
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.config import settings

log = logging.getLogger(__name__)

SESSION_COOKIE = "session"
_ALGORITHM = "HS256"

_hasher = PasswordHash.recommended()
# Checked when the email is unknown, so a wrong email takes as long as a wrong password.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))

if settings.secret_key:
    _SECRET_KEY = settings.secret_key
else:
    _SECRET_KEY = secrets.token_urlsafe(32)
    log.warning("SECRET_KEY is not set in backend/.env, so everyone is signed out when the server restarts.")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> tuple[bool, str | None]:
    """Return (is_valid, new_hash). new_hash is set when the stored hash should be upgraded."""
    if password_hash is None:
        _hasher.verify(password, _DUMMY_HASH)
        return False, None
    return _hasher.verify_and_update(password, password_hash)


def create_session_token(user_id: str, agency_id: str) -> str:
    expires = datetime.now(UTC) + timedelta(days=settings.session_days)
    return jwt.encode({"sub": user_id, "agency": agency_id, "exp": expires}, _SECRET_KEY, algorithm=_ALGORITHM)


def decode_session_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        return None
