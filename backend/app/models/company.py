import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    website: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ats_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # greenhouse, lever, ashby, etc.
    ats_slug: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="company", cascade="all, delete-orphan")
    contacts: Mapped[List["JobContact"]] = relationship("JobContact", back_populates="company", cascade="all, delete-orphan")
