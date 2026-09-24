from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.models.application import Application
from app.models.job import Job
from app.models.company import Company


class ApplicationRepository:
    """Manages application state, drafts, and sent tracking."""

    @staticmethod
    def get_user_applications(db: Session, user_id: str) -> List[Application]:
        return db.query(Application).options(
            joinedload(Application.job).joinedload(Job.company)
        ).filter(Application.user_id == user_id).order_by(Application.created_at.desc()).all()

    @staticmethod
    def get_by_job_and_user(db: Session, user_id: str, job_id: str) -> Optional[Application]:
        return db.query(Application).filter(
            Application.user_id == user_id,
            Application.job_id == job_id
        ).first()

    @staticmethod
    def create_or_update(
        db: Session,
        user_id: str,
        job_id: str,
        status: str,
        match_level: str,
        match_score: int,
        match_breakdown: dict,
        email_subject: Optional[str] = None,
        email_body: Optional[str] = None,
        recipient_email: Optional[str] = None,
        gmail_message_id: Optional[str] = None
    ) -> Application:
        app_record = db.query(Application).filter(
            Application.user_id == user_id,
            Application.job_id == job_id
        ).first()

        if not app_record:
            app_record = Application(
                user_id=user_id,
                job_id=job_id,
                status=status,
                match_level=match_level,
                match_score=match_score,
                match_breakdown=match_breakdown,
                email_subject=email_subject,
                email_body=email_body,
                recipient_email=recipient_email,
                gmail_message_id=gmail_message_id,
                sent_at=datetime.now(timezone.utc) if status == "Sent" else None
            )
            db.add(app_record)
        else:
            app_record.status = status
            app_record.match_level = match_level
            app_record.match_score = match_score
            app_record.match_breakdown = match_breakdown
            if email_subject:
                app_record.email_subject = email_subject
            if email_body:
                app_record.email_body = email_body
            if recipient_email:
                app_record.recipient_email = recipient_email
            if gmail_message_id:
                app_record.gmail_message_id = gmail_message_id
            if status == "Sent":
                app_record.sent_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(app_record)
        return app_record
