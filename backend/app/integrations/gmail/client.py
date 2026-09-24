import base64
import os
import mimetypes
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, Dict, Any, Tuple
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from app.core.config import settings

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid"
]


class GmailClient:
    """Handles Google OAuth and sending job application emails with resume attachments."""

    @staticmethod
    def get_auth_url() -> Tuple[str, Optional[str]]:
        """Generates Google OAuth consent URL."""
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            # Fallback mock URL for testing
            mock_url = (
                f"https://accounts.google.com/o/oauth2/v2/auth?"
                f"client_id=demo-client-id&redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
                f"response_type=code&scope={'%20'.join(GMAIL_SCOPES)}&access_type=offline&prompt=consent"
            )
            return mock_url, None

        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=GMAIL_SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )
        return auth_url, state

    @staticmethod
    def exchange_code(code: str) -> Dict[str, Any]:
        """Exchanges authorization code for access and refresh tokens."""
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            # Demo mode response
            return {
                "access_token": f"demo_access_token_{code[:8]}",
                "refresh_token": f"demo_refresh_token_{code[:8]}",
                "email": "candidate@example.com"
            }

        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=GMAIL_SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        flow.fetch_token(code=code)
        creds = flow.credentials

        # Fetch candidate's Gmail address
        email = "Unknown"
        try:
            service = build("oauth2", "v2", credentials=creds)
            user_info = service.userinfo().get().execute()
            email = user_info.get("email", "")
        except Exception:
            pass

        return {
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "email": email,
            "expiry": creds.expiry.isoformat() if creds.expiry else None
        }

    @staticmethod
    def build_message_with_attachment(
        to_email: str,
        subject: str,
        body_text: str,
        attachment_path: Optional[str] = None
    ) -> str:
        """Constructs a MIME email message with optional PDF/DOCX resume attachment."""
        message = MIMEMultipart()
        message["to"] = to_email
        message["subject"] = subject

        # Attach text body
        message.attach(MIMEText(body_text, "plain"))

        # Attach resume if provided and exists
        if attachment_path and os.path.exists(attachment_path):
            content_type, encoding = mimetypes.guess_type(attachment_path)
            if content_type is None or encoding is not None:
                content_type = "application/octet-stream"
            main_type, sub_type = content_type.split("/", 1)

            with open(attachment_path, "rb") as f:
                part = MIMEBase(main_type, sub_type)
                part.set_payload(f.read())

            encoders.encode_base64(part)
            file_name = os.path.basename(attachment_path)
            part.add_header("Content-Disposition", f'attachment; filename="{file_name}"')
            message.attach(part)

        raw_bytes = message.as_bytes()
        return base64.urlsafe_b64encode(raw_bytes).decode()

    @staticmethod
    def send_email(
        access_token: str,
        refresh_token: Optional[str],
        to_email: str,
        subject: str,
        body_text: str,
        attachment_path: Optional[str] = None,
        as_draft: bool = False
    ) -> Dict[str, Any]:
        """Sends an email or creates a draft via Gmail API."""
        raw_message = GmailClient.build_message_with_attachment(
            to_email=to_email,
            subject=subject,
            body_text=body_text,
            attachment_path=attachment_path
        )

        if not settings.GOOGLE_CLIENT_ID or access_token.startswith("demo_"):
            # Clean simulation for development without real Google credentials
            return {
                "id": f"msg_sim_{os.urandom(4).hex()}",
                "threadId": f"thread_sim_{os.urandom(4).hex()}",
                "status": "Draft Created (Simulated)" if as_draft else "Sent (Simulated)",
                "note": "Simulated send. To send live emails, configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env."
            }

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=GMAIL_SCOPES
        )
        service = build("gmail", "v1", credentials=creds)

        if as_draft:
            draft = service.users().drafts().create(
                userId="me",
                body={"message": {"raw": raw_message}}
            ).execute()
            return {"id": draft.get("id"), "status": "Draft Created"}
        else:
            sent = service.users().messages().send(
                userId="me",
                body={"raw": raw_message}
            ).execute()
            return {"id": sent.get("id"), "threadId": sent.get("threadId"), "status": "Sent"}
