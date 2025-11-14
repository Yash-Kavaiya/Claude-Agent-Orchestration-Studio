"""
Authentication Service
Business logic for authentication operations
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
import uuid
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.user import User
from app.models.otp_code import OTPCode
from app.models.session import Session
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_token,
)
from app.utils.otp import generate_otp, calculate_otp_expiry, is_otp_valid
from app.utils.email import send_otp_email
from app.config import settings


class AuthService:
    """
    Authentication service for managing user authentication
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def request_otp(
        self, email: str, purpose: str = "login", ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Request an OTP code for authentication

        Args:
            email: User email address
            purpose: Purpose of OTP ('login', 'signup', 'reset')
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Tuple of (success: bool, message: str)
        """
        email = email.lower().strip()

        # Check rate limiting (via Redis would be better, but simple check here)
        # Count OTP requests in last 15 minutes
        rate_limit_window = datetime.utcnow() - timedelta(
            seconds=settings.OTP_RATE_LIMIT_WINDOW
        )

        stmt = select(OTPCode).where(
            and_(
                OTPCode.email == email,
                OTPCode.created_at >= rate_limit_window,
            )
        )
        result = await self.db.execute(stmt)
        recent_otps = result.scalars().all()

        if len(recent_otps) >= settings.OTP_RATE_LIMIT:
            return False, "Too many OTP requests. Please try again later."

        # For signup, check if user already exists
        if purpose == "signup":
            stmt = select(User).where(User.email == email)
            result = await self.db.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                return False, "Email already registered"

        # For login/reset, check if user exists
        elif purpose in ["login", "reset"]:
            stmt = select(User).where(User.email == email)
            result = await self.db.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if not existing_user:
                # Don't reveal that email doesn't exist
                # Send fake success but don't actually send email
                return True, "OTP sent to email"

        # Generate OTP
        otp_code = generate_otp()
        expires_at = calculate_otp_expiry()

        # Save OTP to database
        otp = OTPCode(
            email=email,
            code=otp_code,
            purpose=purpose,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(otp)
        await self.db.commit()

        # Send OTP via email
        email_sent = await send_otp_email(email, otp_code, purpose)

        if not email_sent:
            logger.error(f"Failed to send OTP email to {email}")
            return False, "Failed to send OTP. Please try again."

        logger.info(f"OTP sent to {email} for {purpose}")
        return True, "OTP sent to email"

    async def verify_otp(
        self, email: str, code: str, ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, Optional[dict], Optional[str]]:
        """
        Verify an OTP code and authenticate user

        Args:
            email: User email address
            code: OTP code to verify
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Tuple of (success: bool, tokens: Optional[dict], error: Optional[str])
        """
        email = email.lower().strip()

        # Find the most recent unused OTP for this email
        stmt = (
            select(OTPCode)
            .where(
                and_(
                    OTPCode.email == email,
                    OTPCode.code == code,
                    OTPCode.used_at.is_(None),
                )
            )
            .order_by(OTPCode.created_at.desc())
        )
        result = await self.db.execute(stmt)
        otp = result.scalar_one_or_none()

        if not otp:
            return False, None, "Invalid or expired OTP code"

        # Check if OTP is expired
        if otp.is_expired():
            return False, None, "OTP code has expired"

        # Mark OTP as used
        otp.used_at = datetime.utcnow()
        await self.db.commit()

        # Get or create user
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            # Create new user (signup flow)
            user = User(
                email=email,
                is_active=True,
                is_verified=True,
                email_verified_at=datetime.utcnow(),
                last_login_at=datetime.utcnow(),
            )
            self.db.add(user)
            await self.db.flush()
        else:
            # Update last login
            user.last_login_at = datetime.utcnow()
            if not user.is_verified:
                user.is_verified = True
                user.email_verified_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(user)

        # Generate tokens
        tokens = await self._create_tokens(user, ip_address, user_agent)

        return True, tokens, None

    async def _create_tokens(
        self, user: User, ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> dict:
        """
        Create access and refresh tokens for user

        Args:
            user: User object
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Dictionary containing tokens and user info
        """
        # Create token data
        token_data = {
            "sub": str(user.id),
            "email": user.email,
        }

        # Generate tokens
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

        # Store session in database
        session = Session(
            user_id=user.id,
            token_hash=hash_token(access_token),
            refresh_token_hash=hash_token(refresh_token),
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            last_activity_at=datetime.utcnow(),
        )
        self.db.add(session)
        await self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user.to_dict(),
        }

    async def refresh_access_token(
        self, refresh_token: str, ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, Optional[dict], Optional[str]]:
        """
        Refresh access token using refresh token

        Args:
            refresh_token: Refresh token
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Tuple of (success: bool, tokens: Optional[dict], error: Optional[str])
        """
        try:
            # Decode refresh token
            payload = decode_refresh_token(refresh_token)
            user_id = uuid.UUID(payload.get("sub"))

            # Verify session exists and is valid
            token_hash = hash_token(refresh_token)
            stmt = select(Session).where(
                and_(
                    Session.refresh_token_hash == token_hash,
                    Session.expires_at > datetime.utcnow(),
                )
            )
            result = await self.db.execute(stmt)
            session = result.scalar_one_or_none()

            if not session:
                return False, None, "Invalid or expired refresh token"

            # Get user
            stmt = select(User).where(User.id == user_id)
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if not user or not user.is_active:
                return False, None, "User not found or inactive"

            # Delete old session
            await self.db.delete(session)
            await self.db.commit()

            # Create new tokens
            tokens = await self._create_tokens(user, ip_address, user_agent)

            return True, tokens, None

        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return False, None, "Invalid refresh token"

    async def logout(self, access_token: str) -> bool:
        """
        Logout user by invalidating session

        Args:
            access_token: Access token

        Returns:
            True if logout successful, False otherwise
        """
        try:
            # Find and delete session
            token_hash = hash_token(access_token)
            stmt = select(Session).where(Session.token_hash == token_hash)
            result = await self.db.execute(stmt)
            session = result.scalar_one_or_none()

            if session:
                await self.db.delete(session)
                await self.db.commit()
                return True

            return False

        except Exception as e:
            logger.error(f"Error during logout: {e}")
            return False

    async def get_user_from_token(self, access_token: str) -> Optional[User]:
        """
        Get user from access token

        Args:
            access_token: Access token

        Returns:
            User object if valid, None otherwise
        """
        try:
            from app.core.security import decode_access_token

            # Decode token
            payload = decode_access_token(access_token)
            user_id = uuid.UUID(payload.get("sub"))

            # Verify session is valid
            token_hash = hash_token(access_token)
            stmt = select(Session).where(
                and_(
                    Session.token_hash == token_hash,
                    Session.expires_at > datetime.utcnow(),
                )
            )
            result = await self.db.execute(stmt)
            session = result.scalar_one_or_none()

            if not session:
                return None

            # Get user
            stmt = select(User).where(User.id == user_id)
            result = await self.db.execute(stmt)
            user = result.scalar_one_or_none()

            if user and user.is_active:
                # Update last activity
                session.last_activity_at = datetime.utcnow()
                await self.db.commit()
                return user

            return None

        except Exception as e:
            logger.error(f"Error getting user from token: {e}")
            return None
