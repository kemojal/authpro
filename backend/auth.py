from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import uuid
import os
from dotenv import load_dotenv

from database import get_db
from models import User

# Load environment variables
load_dotenv()

# Set up router
router = APIRouter(tags=["authentication"])

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# OAuth2 configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Google OAuth setup
config = Config(environ=os.environ)
oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
    client_kwargs={"scope": "openid email profile"},
)

# Token creation and verification
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: str, db: Session):
    token = str(uuid.uuid4())
    expiry = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Store token in database
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.refresh_token = token
        user.refresh_token_expires_at = expiry
        db.commit()
        
    return token

def get_token_from_cookie(request: Request):
    # Print all cookies for debugging
    print(f"All cookies: {request.cookies}")
    
    # Try to get token from different possible cookie names
    token = request.cookies.get("access_token")
    if not token:
        # Try other possible cookie names
        token = request.cookies.get("token")
        
    if not token:
        # Try to extract from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove 'Bearer ' prefix
            
    if not token:
        print("No token found in cookies or Authorization header")
        return None
    
    # Print token for debugging
    print(f"Found token: {token[:15]}...")
    
    # Remove Bearer prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    return token

async def verify_token(request: Request = None, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Print auth information for debugging
    if request:
        print(f"verify_token called with Request: Authorization header: {request.headers.get('Authorization')}")
        print(f"verify_token called with Request: Cookie header: {request.headers.get('Cookie')}")
    
    # If request is provided, try to get token from cookie
    if request and (not token or token == ""):
        print("No token in OAuth2 dependency, trying cookies")
        token = get_token_from_cookie(request)
    elif token:
        print(f"Token from OAuth2 dependency: {token[:15]}...")
    
    if not token:
        print("No token found in Authorization header or cookies")
        raise credentials_exception
    
    try:
        print(f"Attempting to decode token: {token[:15]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            print("No user_id in token payload")
            raise credentials_exception
        print(f"Token decoded successfully, user_id: {user_id}")
    except JWTError as e:
        print(f"JWT decode error: {str(e)}")
        raise credentials_exception
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            print(f"User with ID {user_id} not found")
            raise credentials_exception
            
        # Ensure user has roles attribute, even if empty
        if not hasattr(user, 'roles') or user.roles is None:
            user.roles = []
            
        print(f"User found: {user.email}")
        return user
    except Exception as e:
        print(f"Error retrieving user: {str(e)}")
        raise credentials_exception

# Helper function since users module might not be available due to circular imports
def verify_password(plain_password, hashed_password):
    # Import locally to avoid circular imports
    from users import pwd_context
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str):
    """
    Authenticate a user with email and password.
    Raises an exception if authentication fails, returns User object if successful.
    """
    # Import locally to avoid circular imports
    from users import get_user_by_email
    
    user = get_user_by_email(db, email)
    if not user or not user.hashed_password:
        print(f"User not found or has no password: {email}")
        return False
        
    if not verify_password(password, user.hashed_password):
        print(f"Password verification failed for user: {email}")
        return False
        
    # Ensure user has roles attribute, even if empty
    if not hasattr(user, 'roles') or user.roles is None:
        user.roles = []
        
    return user

# Login endpoints
@router.post("/token")
async def login(
    response: Response, 
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Record login time
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(user.id, db)
    
    # Get environment
    is_dev = os.getenv("ENVIRONMENT", "development") == "development"
    
    # Get the client's origin from the request header
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Log what we're doing for debugging
    print(f"Setting cookies for user {user.email}, token: {access_token[:15]}..., is_dev: {is_dev}, frontend_url: {frontend_url}")
    
    # Set access token in cookie - with very permissive settings for development
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,  # False for development to work with http
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=None  # Allow cookies to work on localhost
    )
    
    # Also set in a non-httpOnly cookie for debugging and JS access
    response.set_cookie(
        key="token_debug",
        value=f"Bearer {access_token}",
        httponly=False,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    # Set refresh token in cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # False for development to work with http
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
        domain=None  # Allow cookies to work on localhost
    )
    
    # Log the token for debugging
    print(f"Login successful for {user.email}, token set")
    print(f"Access token: {access_token[:15]}...")
    
    # Return a detailed success response with the token info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email
    }

# Google OAuth routes
@router.get("/login/google")
async def login_google(request: Request):
    # Manually construct the redirect URI to avoid URL object conversion issues
    base_url = str(request.base_url).rstrip('/')
    redirect_uri = f"{base_url}/auth/google"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google")
async def auth_google(request: Request, response: Response, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not get user info from Google"
        )
    
    # Get or create user
    email = user_info.get("email")
    from users import get_user_by_email
    user = get_user_by_email(db, email)
    
    if not user:
        # Create new user from Google info
        user = User(
            email=email,
            first_name=user_info.get("given_name", ""),
            last_name=user_info.get("family_name", ""),
            is_verified=user_info.get("email_verified", False),
            oauth_provider="google",
            oauth_id=user_info.get("sub"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user with latest info
        user.last_login = datetime.utcnow()
        db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(user.id, db)
    
    # Set cookies with less strict settings for development
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    # Log the token for debugging
    print(f"Google login successful for {user.email}, token set")
    
    # Redirect to frontend
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return {"access_token": access_token, "token_type": "bearer", "redirect_url": frontend_url}

# Refresh token endpoint
@router.post("/refresh-token")
async def refresh_token(
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )
    
    # Find user with this refresh token
    user = db.query(User).filter(
        User.refresh_token == refresh_token,
        User.refresh_token_expires_at > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(user.id, db)
    
    # Set new cookies with less strict settings for development
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    # Log the token for debugging
    print(f"Token refreshed for {user.email}")
    
    return {"access_token": access_token, "token_type": "bearer"}

# Convenience dependency for endpoints
async def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency that gets the current user from either the Authorization header or cookies.
    This automatically passes the request to verify_token.
    """
    return await verify_token(request=request, token=token, db=db)

# Logout endpoint
@router.post("/logout")
async def logout(response: Response, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Clear refresh token in database
    current_user.refresh_token = None
    current_user.refresh_token_expires_at = None
    db.commit()
    
    # Clear cookies
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    
    return {"detail": "Successfully logged out"}
