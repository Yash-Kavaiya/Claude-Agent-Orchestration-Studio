"""
Unit tests for OTP utilities
"""
import pytest
from datetime import datetime, timedelta

from app.utils.otp import (
    generate_otp,
    calculate_otp_expiry,
    is_otp_valid,
    format_otp_for_display,
)
from app.config import settings


@pytest.mark.unit
def test_generate_otp_default_length():
    """Test OTP generation with default length"""
    otp = generate_otp()

    assert isinstance(otp, str)
    assert len(otp) == settings.OTP_LENGTH
    assert otp.isdigit()


@pytest.mark.unit
def test_generate_otp_custom_length():
    """Test OTP generation with custom length"""
    otp = generate_otp(length=8)

    assert isinstance(otp, str)
    assert len(otp) == 8
    assert otp.isdigit()


@pytest.mark.unit
def test_generate_otp_uniqueness():
    """Test that generated OTPs are different"""
    otp1 = generate_otp()
    otp2 = generate_otp()

    # While there's a small chance they could be the same,
    # it's extremely unlikely for 6-digit codes
    assert otp1 != otp2 or len(set([generate_otp() for _ in range(10)])) > 1


@pytest.mark.unit
def test_calculate_otp_expiry_default():
    """Test OTP expiry calculation with default time"""
    expiry = calculate_otp_expiry()

    assert isinstance(expiry, datetime)
    assert expiry > datetime.utcnow()

    # Should be approximately OTP_EXPIRY_MINUTES in the future
    time_diff = (expiry - datetime.utcnow()).total_seconds()
    expected_seconds = settings.OTP_EXPIRY_MINUTES * 60
    assert abs(time_diff - expected_seconds) < 2  # Allow 2 seconds tolerance


@pytest.mark.unit
def test_calculate_otp_expiry_custom():
    """Test OTP expiry calculation with custom time"""
    expiry = calculate_otp_expiry(minutes=10)

    time_diff = (expiry - datetime.utcnow()).total_seconds()
    expected_seconds = 10 * 60
    assert abs(time_diff - expected_seconds) < 2


@pytest.mark.unit
def test_is_otp_valid_correct_code():
    """Test OTP validation with correct code"""
    code = "123456"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    assert is_otp_valid(code, code, expires_at) is True


@pytest.mark.unit
def test_is_otp_valid_wrong_code():
    """Test OTP validation with wrong code"""
    code = "123456"
    wrong_code = "654321"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    assert is_otp_valid(wrong_code, code, expires_at) is False


@pytest.mark.unit
def test_is_otp_valid_expired():
    """Test OTP validation with expired code"""
    code = "123456"
    expires_at = datetime.utcnow() - timedelta(minutes=1)  # Expired

    assert is_otp_valid(code, code, expires_at) is False


@pytest.mark.unit
def test_format_otp_for_display_six_digits():
    """Test OTP formatting for 6-digit codes"""
    otp = "123456"
    formatted = format_otp_for_display(otp)

    assert formatted == "123 456"


@pytest.mark.unit
def test_format_otp_for_display_other_lengths():
    """Test OTP formatting for other lengths"""
    otp = "12345678"
    formatted = format_otp_for_display(otp)

    assert " " in formatted
    assert formatted.replace(" ", "") == otp
