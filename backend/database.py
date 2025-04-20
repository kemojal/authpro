from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for local development
# Set DATABASE_URL=sqlite:///./test.db by default
database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# For SQLite, we need to configure it to handle foreign keys properly
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

SQLALCHEMY_DATABASE_URL = database_url

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
