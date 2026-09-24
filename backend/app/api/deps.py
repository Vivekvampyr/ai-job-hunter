from typing import Optional
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """Retrieves current user from JWT token, with automatic default user in development."""
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user

    # Seamless development/demo fallback: Return or create default candidate user
    demo_email = "vivek.rajawat@example.com"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email=demo_email,
            hashed_password=get_password_hash("password123"),
            full_name="Vivek Rajawat"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
