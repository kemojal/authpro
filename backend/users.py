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
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@example.com")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
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
        
        msg = EmailMessage()
        msg.set_content(f"""
        Hello,
        
        Please verify your email address by clicking the link below:
        
        {verification_url}
        
        This link will expire in {VERIFICATION_TOKEN_EXPIRY_HOURS} hours.
        
        If you did not sign up for this account, you can ignore this email.
        
        Thanks,
        The AuthPro Team
        """)
        
        msg['Subject'] = 'Verify your email address'
        msg['From'] = EMAIL_FROM
        msg['To'] = user_email
        
        # For development, just log the email instead of sending
        if os.getenv("ENVIRONMENT", "development") == "development":
            print(f"Would send verification email to {user_email} with token {token}")
            print(f"Verification URL: {verification_url}")
            return True
            
        # Send the email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Error sending verification email: {str(e)}")
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
    # Only allow for unverified users
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    # Generate new token
    token = generate_verification_token(db, current_user)
    
    # Send verification email
    email_sent = send_verification_email(current_user.email, token)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )
    
    return {"message": "Verification email sent"}
