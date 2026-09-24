from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    is_gmail_connected: bool = False
    gmail_email: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GmailAuthURLResponse(BaseModel):
    auth_url: str


class GmailConnectRequest(BaseModel):
    code: str
