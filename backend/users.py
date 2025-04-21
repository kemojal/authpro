from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
try:
    # Pydantic V2
    from pydantic import BaseModel, EmailStr, field_validator
    USE_PYDANTIC_V2 = True
except ImportError:
    # Pydantic V1
    from pydantic import BaseModel, EmailStr, validator
    field_validator = validator
    USE_PYDANTIC_V2 = False
from passlib.context import CryptContext
from datetime import datetime, timedelta
import uuid
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

from database import get_db
from models import User, Role
import auth

# Load environment variables
load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Router setup
router = APIRouter(
    prefix="/users",
    tags=["users"]
)

# Email verification settings
VERIFICATION_TOKEN_EXPIRY_HOURS = int(os.getenv("VERIFICATION_TOKEN_EXPIRY_HOURS", "24"))
# Hardcoded values for SMTP to ensure they work even if env vars aren't loading properly
SMTP_SERVER = "smtp.gmail.com"  # Hardcoded instead of using env var
SMTP_PORT = 465  # Gmail SSL port
EMAIL_FROM = "kemo3855@gmail.com"  # Hardcoded Gmail address
EMAIL_FROM_NAME = "AuthPro"
SMTP_USERNAME = "kemo3855@gmail.com"  # Hardcoded Gmail username
SMTP_PASSWORD = "bmhv cwln qigw vzhc"  # Gmail app password
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Pydantic models for request/response
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
class UserCreate(UserBase):
    password: str
    
    # Use appropriate validator syntax based on version
    if USE_PYDANTIC_V2:
        @field_validator('password')
        @classmethod
        def password_strength(cls, v):
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            return v
    else:
        @field_validator('password')
        @classmethod
        def password_strength(cls, v):
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            return v

class RoleResponse(BaseModel):
    id: int
    name: str
    
    # Model config compatible with both V1 and V2
    if USE_PYDANTIC_V2:
        model_config = {
            "from_attributes": True
        }
    else:
        class Config:
            orm_mode = True

class UserResponse(UserBase):
    id: str
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    roles: List[RoleResponse] = []
    
    # Model config compatible with both V1 and V2
    if USE_PYDANTIC_V2:
        model_config = {
            "from_attributes": True,
            "populate_by_name": True,
            "arbitrary_types_allowed": True
        }
    else:
        class Config:
            orm_mode = True
            allow_population_by_field_name = True
            arbitrary_types_allowed = True
    
    # Use appropriate validator syntax based on version
    if USE_PYDANTIC_V2:
        @field_validator('roles', mode='before')
        @classmethod
        def validate_roles(cls, v):
            # Ensure roles is always a list even if None
            return v or []
    else:
        @field_validator('roles', pre=True)
        @classmethod
        def validate_roles(cls, v):
            # Ensure roles is always a list even if None
            return v or []

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    
    # Use appropriate validator syntax based on version
    if USE_PYDANTIC_V2:
        @field_validator('password')
        @classmethod
        def password_strength(cls, v):
            if v is not None and len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            return v
    else:
        @field_validator('password')
        @classmethod
        def password_strength(cls, v):
            if v is not None and len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            return v

# Helper functions
def get_user(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not user.hashed_password:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Email verification functions
def generate_verification_token(db: Session, user: User):
    """Generate a new verification token for a user and save it to the database."""
    token = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRY_HOURS)
    
    user.verification_token = token
    user.verification_token_expires_at = expiry
    db.commit()
    
    return token

def send_verification_email(user_email: str, token: str):
    """Send a verification email with the given token."""
    try:
        verification_url = f"{FRONTEND_URL}/verify-email?token={token}"
        
        # Create a professional HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center;
                    padding: 20px 0;
                    border-bottom: 1px solid #f0f0f0;
                }}
                .logo {{
                    color: #4F46E5;
                    font-size: 28px;
                    font-weight: 700;
                    text-decoration: none;
                }}
                .content {{
                    padding: 30px 20px;
                }}
                .verify-button {{
                    display: inline-block;
                    background-color: #4F46E5;
                    color: white;
                    text-decoration: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    font-weight: 600;
                    margin: 20px 0;
                    text-align: center;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #888888;
                    font-size: 12px;
                    border-top: 1px solid #f0f0f0;
                }}
                .expiry-info {{
                    color: #666666;
                    font-size: 14px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">AuthPro</div>
                </div>
                <div class="content">
                    <h2>Verify Your Email Address</h2>
                    <p>Hello,</p>
                    <p>Thank you for signing up with AuthPro. Please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="verify-button">Verify Email</a>
                    </div>
                    
                    <p>If the button doesn't work, you can also verify by copying and pasting this link into your browser:</p>
                    <p style="word-break: break-all; font-size: 14px;"><a href="{verification_url}">{verification_url}</a></p>
                    
                    <p class="expiry-info">This link will expire in {VERIFICATION_TOKEN_EXPIRY_HOURS} hours.</p>
                    
                    <p>If you did not sign up for an AuthPro account, you can safely ignore this email.</p>
                    <p>Best regards,<br>The AuthPro Team</p>
                </div>
                <div class="footer">
                    &copy; {datetime.utcnow().year} AuthPro. All rights reserved.<br>
                    This is an automated message, please do not reply.
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create a plain text version as fallback
        plain_text = f"""
        Hello,
        
        Thank you for signing up with AuthPro. Please verify your email address by clicking the link below:
        
        {verification_url}
        
        This link will expire in {VERIFICATION_TOKEN_EXPIRY_HOURS} hours.
        
        If you did not sign up for this account, you can ignore this email.
        
        Best regards,
        The AuthPro Team
        """
        
        # Debug settings
        print(f"\n=== EMAIL CONFIGURATION ===")
        print(f"SMTP_SERVER: {SMTP_SERVER}")
        print(f"SMTP_PORT: {SMTP_PORT}")
        print(f"SMTP_USERNAME: {SMTP_USERNAME}")
        print(f"EMAIL_FROM: {EMAIL_FROM}")
        
        msg = EmailMessage()
        msg.set_content(plain_text)
        msg.add_alternative(html_content, subtype='html')
        
        msg['Subject'] = 'Verify your AuthPro account'
        formatted_from = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
        msg['From'] = formatted_from
        msg['To'] = user_email
        
        # Simplified Gmail handling - just use SSL
        print(f"Attempting to connect to Gmail via SSL...")
        import ssl
        context = ssl.create_default_context()
        
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
            print(f"SSL connection established, logging in with {SMTP_USERNAME}")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            print(f"Sending email to: {user_email}")
            server.send_message(msg)
            print(f"Verification email sent successfully to {user_email}")
        
        return True
            
    except Exception as e:
        import traceback
        print(f"ERROR sending verification email: {str(e)}")
        print("Traceback:")
        traceback.print_exc()
        return False

# Endpoints
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        is_verified=False  # Default to unverified
    )
    
    # Add default role
    default_role = db.query(Role).filter(Role.name == "user").first()
    if default_role:
        db_user.roles.append(default_role)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate verification token and send email
    try:
        token = generate_verification_token(db, db_user)
        send_verification_email(db_user.email, token)
    except Exception as e:
        print(f"Error sending verification email: {str(e)}")
        # Continue even if email fails - user is still created
    
    return db_user

@router.get("/me", response_model=UserResponse)
def read_users_me(request: Request, current_user: User = Depends(auth.get_current_user)):
    print(f"GET /users/me - Headers: {dict(request.headers)}")
    print(f"GET /users/me - Cookies: {request.cookies}")
    
    # Add some validation and debugging to make sure we return a valid user
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not authenticated",
            )
            
        # Ensure required fields exist
        if not hasattr(current_user, 'id') or not current_user.id:
            print("User missing id field")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid user data: missing id",
            )
            
        # Ensure user has roles list
        if not hasattr(current_user, 'roles') or current_user.roles is None:
            print("User missing roles, setting empty list")
            current_user.roles = []
            
        print(f"Returning user data for {current_user.email}")
        return current_user
        
    except Exception as e:
        print(f"Error in /users/me: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user data: {str(e)}",
        )

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: str, 
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    # Check if user has admin role
    is_admin = any(role.name == "admin" for role in current_user.roles)
    
    # Only allow users to access their own data unless they're admin
    if user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_user = get_user(db, user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user

@router.patch("/me", response_model=UserResponse)
def update_user(
    user_update: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    # Update user details
    if user_update.email is not None:
        # Check if email is already taken
        existing_user = get_user_by_email(db, user_update.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email
        
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
        
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
        
    if user_update.password is not None:
        current_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    # Check if user has admin role
    is_admin = any(role.name == "admin" for role in current_user.roles)
    
    # Only allow users to delete their own account unless they're admin
    if user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db_user = get_user(db, user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(db_user)
    db.commit()
    
    return None

@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(token: dict, db: Session = Depends(get_db)):
    """Verify a user's email address using a verification token."""
    verification_token = token.get("token")
    if not verification_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token is required"
        )
    
    # Find user with this token
    user = db.query(User).filter(
        User.verification_token == verification_token,
        User.verification_token_expires_at > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Mark user as verified
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.commit()
    
    return {"message": "Email successfully verified"}

@router.post("/resend-verification", status_code=status.HTTP_200_OK)
def resend_verification(
    request: Request,
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Resend a verification email to the current user."""
    # Log useful info for debugging
    print(f"\n=== RESEND VERIFICATION REQUEST ===")
    print(f"User email: {current_user.email}")
    print(f"User ID: {current_user.id}")
    print(f"Is verified: {current_user.is_verified}")
    
    # Only allow for unverified users
    if current_user.is_verified:
        print(f"User already verified: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    try:
        # Generate new token
        print(f"Generating verification token for user: {current_user.email}")
        token = generate_verification_token(db, current_user)
        print(f"Generated token: {token[:8]}...")
        
        # Send verification email
        print(f"Attempting to send verification email to: {current_user.email}")
        email_sent = send_verification_email(current_user.email, token)
        
        if not email_sent:
            print(f"Failed to send verification email to {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email. Please try again later or contact support."
            )
        
        print(f"Successfully sent verification email to: {current_user.email}")
        return {"message": "Verification email sent", "success": True}
    except Exception as e:
        import traceback
        print(f"ERROR in resend_verification: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email service temporarily unavailable. Please try again later."
        )
