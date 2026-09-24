import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Application(Base):
    """Tracks candidate match level, generated outreach email, and Gmail submission state."""
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    status: Mapped[str] = mapped_column(String(50), default="Draft", nullable=False)  # Draft, Generated, Sent, Rejected, Interviewing
    match_level: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)  # High, Medium, Low
    match_score: Mapped[int] = mapped_column(Integer, default=50, nullable=False)  # 0 to 100
    match_breakdown: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    email_subject: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recipient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    resume_attached: Mapped[bool] = mapped_column(Boolean, default=True)

    # Gmail API tracking
    gmail_message_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gmail_thread_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="applications")
    job: Mapped["Job"] = relationship("Job", back_populates="applications")
