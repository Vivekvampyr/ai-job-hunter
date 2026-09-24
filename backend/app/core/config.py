import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Job Hunter"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database: Supports PostgreSQL (Supabase/Render/Local) with fallback to SQLite for local dev
    DATABASE_URL: str = "sqlite:///./ai_job_hunter.db"
    
    # Security & JWT
    SECRET_KEY: str = "ai_job_hunter_super_secret_jwt_key_change_in_production_987654321"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    
    # File Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    MAX_FILE_SIZE_MB: int = 10
    
    # Google OAuth / Gmail API
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/gmail/callback"
    
    # AI Providers (Gemini or OpenAI - optional; deterministic fallback is active if empty)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    OPENAI_API_KEY: str = ""
    
    # Curated Tech Companies for Public ATS Search
    GREENHOUSE_COMPANIES: List[str] = [
        "stripe", "figma", "github", "gitlab", "canonical", "elastic", "mongodb", "cloudflare"
    ]
    LEVER_COMPANIES: List[str] = [
        "palantir"
    ]
    ASHBY_COMPANIES: List[str] = [
        "supabase", "linear", "resend", "ramp", "synthesia"
    ]
    SMARTRECRUITERS_COMPANIES: List[str] = [
        "redbull", "smartrecruiters"
    ]
    WORKABLE_COMPANIES: List[str] = [
        "deliveroo", "travelperk"
    ]
    
    # Search Engine Discovery (Google Custom Search or Public DuckDuckGo Engine)
    ENABLE_SEARCH_ENGINE_DISCOVERY: bool = True
    GOOGLE_SEARCH_API_KEY: str = ""
    GOOGLE_SEARCH_ENGINE_ID: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True, 
        extra="ignore"
    )


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
