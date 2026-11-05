import uuid
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.security import decode_session_token

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(db: DbSession, session: Annotated[str | None, Cookie()] = None) -> User:
    claims = decode_session_token(session) if session else None
    user = None
    if claims:
        try:
            user = db.get(User, uuid.UUID(claims["sub"]))
        except (KeyError, ValueError):
            user = None
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "You're signed out. Sign in again.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
