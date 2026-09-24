import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class JobContact(Base):
    """Stores company contact info and recruiter points of contact.
    
    Strictly follows constraint:
    Never invent emails or phone numbers. If unavailable, email and phone
    are recorded as 'Not Found'.
    """
    __tablename__ = "job_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)

    email: Mapped[str] = mapped_column(String(255), default="Not Found", nullable=False)
    phone: Mapped[str] = mapped_column(String(100), default="Not Found", nullable=False)
    application_form: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    contact_type: Mapped[str] = mapped_column(String(100), default="Careers / Recruitment", nullable=False)
    source_note: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="contacts")
    job: Mapped[Optional["Job"]] = relationship("Job", back_populates="contacts")
