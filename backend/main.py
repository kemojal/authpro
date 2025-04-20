from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.security import OAuth2PasswordBearer
import os
from typing import List
import logging
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import engine, Base, get_db
from models import User, Role

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Auth Starter Kit API",
    description="A FastAPI backend with Google OAuth and token-based authentication",
    version="0.1.0",
)

# Session middleware - required for OAuth
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "your-secret-key-for-session")
)

# CORS configuration
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Initialize default roles
@app.on_event("startup")
async def create_default_roles():
    db = next(get_db())
    roles = ["user", "admin"]
    
    for role_name in roles:
        exists = db.query(Role).filter(Role.name == role_name).first()
        if not exists:
            role = Role(name=role_name, description=f"{role_name.capitalize()} role")
            db.add(role)
    
    db.commit()
    logger.info("Default roles created")

# Import routers - moved after app is created to avoid circular imports
import auth
import users

# Include routers
app.include_router(auth.router)
app.include_router(users.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Auth Starter Kit API",
        "docs": "/docs",
        "redoc": "/redoc",
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Protected example endpoint
@app.get("/protected", response_model=dict)
async def protected_route(request: Request, current_user: User = Depends(auth.get_current_user)):
    return {
        "message": "This is a protected route",
        "user_id": current_user.id,
        "email": current_user.email,
    }

# Admin-only example endpoint
@app.get("/admin", response_model=dict)
async def admin_route(request: Request, current_user: User = Depends(auth.get_current_user)):
    # Check if user has admin role
    is_admin = any(role.name == "admin" for role in current_user.roles)
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin role required."
        )
    
    return {
        "message": "This is an admin-only route",
        "user_id": current_user.id,
        "email": current_user.email,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
