from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import GmailAuthURLResponse, GmailConnectRequest, UserResponse
from app.integrations.gmail.client import GmailClient

router = APIRouter()


@router.get("/auth-url", response_model=GmailAuthURLResponse)
def get_auth_url():
    auth_url, _ = GmailClient.get_auth_url()
    return GmailAuthURLResponse(auth_url=auth_url)


@router.post("/connect", response_model=UserResponse)
def connect_gmail(
    req: GmailConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        tokens = GmailClient.exchange_code(req.code)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to exchange Google OAuth code: {str(e)}"
        )

    current_user.gmail_access_token = tokens.get("access_token")
    current_user.gmail_refresh_token = tokens.get("refresh_token")
    current_user.gmail_email = tokens.get("email")
    if tokens.get("expiry"):
        try:
            current_user.gmail_token_expiry = datetime.fromisoformat(tokens["expiry"])
        except Exception:
            pass

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_gmail_connected=True,
        gmail_email=current_user.gmail_email,
        created_at=current_user.created_at
    )


@router.post("/disconnect", response_model=UserResponse)
def disconnect_gmail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.gmail_access_token = None
    current_user.gmail_refresh_token = None
    current_user.gmail_token_expiry = None
    current_user.gmail_email = None

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_gmail_connected=False,
        gmail_email=None,
        created_at=current_user.created_at
    )
