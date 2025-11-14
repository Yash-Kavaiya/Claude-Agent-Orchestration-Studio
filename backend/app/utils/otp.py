"""
OTP (One-Time Password) Utilities
Generate and validate OTP codes
"""
import random
import string
from datetime import datetime, timedelta

from app.config import settings


def generate_otp(length: int = None) -> str:
    """
    Generate a random numeric OTP code

    Args:
        length: Length of OTP code (default from settings)

    Returns:
        String of random digits
    """
    if length is None:
        length = settings.OTP_LENGTH

    # Generate random digits
    digits = string.digits
    otp = "".join(random.choice(digits) for _ in range(length))

    return otp


def calculate_otp_expiry(minutes: int = None) -> datetime:
    """
    Calculate OTP expiration timestamp

    Args:
        minutes: Number of minutes until expiry (default from settings)

    Returns:
        Datetime object representing expiry time
    """
    if minutes is None:
        minutes = settings.OTP_EXPIRY_MINUTES

    return datetime.utcnow() + timedelta(minutes=minutes)


def is_otp_valid(code: str, expected_code: str, expires_at: datetime) -> bool:
    """
    Validate an OTP code

    Args:
        code: Code provided by user
        expected_code: Expected code from database
        expires_at: Expiration timestamp

    Returns:
        True if code is valid and not expired, False otherwise
    """
    # Check if expired
    if datetime.utcnow() > expires_at:
        return False

    # Check if code matches
    return code == expected_code


def format_otp_for_display(otp: str) -> str:
    """
    Format OTP code for display (e.g., "123 456")

    Args:
        otp: OTP code string

    Returns:
        Formatted OTP string
    """
    # For 6-digit codes, split into two groups of 3
    if len(otp) == 6:
        return f"{otp[:3]} {otp[3:]}"

    # For other lengths, insert space every 3 digits
    return " ".join([otp[i : i + 3] for i in range(0, len(otp), 3)])
