"""
Email Utilities
Send emails via SendGrid or SMTP
"""
from typing import Optional
import httpx
from loguru import logger

from app.config import settings


async def send_email_sendgrid(
    to_email: str, subject: str, html_content: str, text_content: Optional[str] = None
) -> bool:
    """
    Send email using SendGrid API

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email content
        text_content: Plain text email content (optional)

    Returns:
        True if email sent successfully, False otherwise
    """
    if not settings.SENDGRID_API_KEY:
        logger.error("SendGrid API key not configured")
        return False

    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {
            "email": settings.EMAIL_FROM,
            "name": settings.EMAIL_FROM_NAME,
        },
        "subject": subject,
        "content": [
            {"type": "text/html", "value": html_content},
        ],
    }

    # Add plain text content if provided
    if text_content:
        payload["content"].insert(0, {"type": "text/plain", "value": text_content})

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)

            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(
                    f"Failed to send email: {response.status_code} - {response.text}"
                )
                return False

    except Exception as e:
        logger.error(f"Error sending email via SendGrid: {e}")
        return False


async def send_email_smtp(
    to_email: str, subject: str, html_content: str, text_content: Optional[str] = None
) -> bool:
    """
    Send email using SMTP

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email content
        text_content: Plain text email content (optional)

    Returns:
        True if email sent successfully, False otherwise
    """
    # TODO: Implement SMTP email sending
    # This would use aiosmtplib or similar library
    logger.warning("SMTP email sending not yet implemented")
    return False


async def send_email(
    to_email: str, subject: str, html_content: str, text_content: Optional[str] = None
) -> bool:
    """
    Send email using configured provider

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email content
        text_content: Plain text email content (optional)

    Returns:
        True if email sent successfully, False otherwise
    """
    provider = settings.EMAIL_PROVIDER.lower()

    if provider == "sendgrid":
        return await send_email_sendgrid(to_email, subject, html_content, text_content)
    elif provider == "smtp":
        return await send_email_smtp(to_email, subject, html_content, text_content)
    else:
        logger.error(f"Unknown email provider: {provider}")
        return False


async def send_otp_email(to_email: str, otp_code: str, purpose: str = "login") -> bool:
    """
    Send OTP code via email

    Args:
        to_email: Recipient email address
        otp_code: OTP code to send
        purpose: Purpose of OTP ('login', 'signup', 'reset')

    Returns:
        True if email sent successfully, False otherwise
    """
    # Format OTP for display
    from app.utils.otp import format_otp_for_display

    formatted_otp = format_otp_for_display(otp_code)

    # Determine subject and message based on purpose
    purpose_messages = {
        "login": ("Login Verification Code", "log in to"),
        "signup": ("Welcome! Verify Your Email", "complete your registration with"),
        "reset": ("Password Reset Code", "reset your password for"),
    }

    subject_prefix, action_text = purpose_messages.get(
        purpose, ("Verification Code", "verify your account with")
    )

    subject = f"{subject_prefix} - {settings.APP_NAME}"

    # HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #333333; font-size: 24px;">
                                    {settings.APP_NAME}
                                </h1>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td style="padding: 20px 40px;">
                                <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                    Hello,
                                </p>
                                <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                    Use the following code to {action_text} {settings.APP_NAME}:
                                </p>

                                <!-- OTP Code Box -->
                                <div style="background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                                    <div style="font-size: 36px; font-weight: bold; color: #333333; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                        {formatted_otp}
                                    </div>
                                </div>

                                <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                    <strong>This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</strong>
                                </p>
                                <p style="margin: 0 0 20px 0; color: #999999; font-size: 13px; line-height: 1.5;">
                                    If you didn't request this code, please ignore this email.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; color: #999999; font-size: 12px;">
                                    © 2025 {settings.APP_NAME}. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    # Plain text content
    text_content = f"""
{settings.APP_NAME}

Hello,

Use the following code to {action_text} {settings.APP_NAME}:

{formatted_otp}

This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.

If you didn't request this code, please ignore this email.

© 2025 {settings.APP_NAME}. All rights reserved.
    """

    return await send_email(to_email, subject, html_content, text_content)
