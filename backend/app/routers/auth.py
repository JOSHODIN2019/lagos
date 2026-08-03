"""
Stage 04
Step 06

Purpose:
Signup, login, and "who am I" routes. Signup/login return a JWT; /me
demonstrates a protected route via the get_current_user dependency.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.config import ADMIN_EMAILS
from app.deps import get_current_user
from app.services.audit import log_event
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.users import EmailAlreadyRegistered, create_user, get_user_by_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupRequest):
    try:
        user = create_user(
            email=body.email.lower(),
            password_hash=hash_password(body.password),
            name=body.name.strip(),
        )
    except EmailAlreadyRegistered:
        log_event("auth.signup_conflict", email=body.email.lower())
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists",
        )

    user["isAdmin"] = user["email"].lower() in ADMIN_EMAILS
    token = create_access_token(user["id"], user["email"])
    log_event("auth.signup", user_id=user["id"], email=user["email"])
    return {"token": token, "user": user}


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    user = get_user_by_email(body.email.lower())
    if user is None or not verify_password(body.password, user["password_hash"]):
        log_event("auth.login_failure", email=body.email.lower())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(user["id"], user["email"])
    log_event("auth.login_success", user_id=user["id"], email=user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "createdAt": user["created_at"],
            "isAdmin": user["email"].lower() in ADMIN_EMAILS,
        },
    }


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
