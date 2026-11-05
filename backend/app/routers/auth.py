import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.config import settings
from app.deps import CurrentUser, DbSession
from app.models import User
from app.security import SESSION_COOKIE, create_session_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=200)


class AgencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: str
    agency: AgencyOut


@router.post("/login")
def login(body: LoginRequest, response: Response, db: DbSession) -> UserOut:
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    valid, new_hash = verify_password(body.password, user.password_hash if user else None)
    if user is None or not valid or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "That email and password don't match.")

    if new_hash:
        user.password_hash = new_hash
    user.last_login_at = datetime.now(UTC)
    db.commit()

    response.set_cookie(
        SESSION_COOKIE,
        create_session_token(str(user.id), str(user.agency_id)),
        max_age=settings.session_days * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
    )
    return UserOut.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, httponly=True, samesite="lax", secure=settings.cookie_secure)


@router.get("/me")
def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)
