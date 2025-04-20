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
from datetime import datetime

from database import get_db
from models import User, Role
import auth

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Router setup
router = APIRouter(
    prefix="/users",
    tags=["users"]
)

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
        last_name=user.last_name
    )
    
    # Add default role
    default_role = db.query(Role).filter(Role.name == "user").first()
    if default_role:
        db_user.roles.append(default_role)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
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
