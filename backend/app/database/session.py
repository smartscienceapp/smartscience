import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# ⬇️ WAJIB: load .env sebelum os.getenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"DEBUG: DATABASE_URL loaded: {str(DATABASE_URL)[:10]}...")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL tidak ditemukan di environment variable!")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "?" in DATABASE_URL:
    if "sslmode=require" not in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
else:
    DATABASE_URL += "?sslmode=require"

engine_database = create_engine(
    DATABASE_URL,
    pool_size=3,
    max_overflow=0,
    pool_pre_ping=True,
    connect_args={
        "sslmode": "require",
        "connect_timeout": 10
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_database)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
