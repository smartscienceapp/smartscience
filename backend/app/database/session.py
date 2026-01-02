import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 1. Ambil URL dari Env
DATABASE_URL = os.getenv("DATABASE_URL")

# Debugging (Cek di Log Hugging Face apakah URL terbaca atau None)
# JANGAN print full URL karena ada password, print 10 karakter awal saja
print(f"DEBUG: DATABASE_URL loaded: {str(DATABASE_URL)[:10]}...") 

if not DATABASE_URL:
    raise ValueError("DATABASE_URL tidak ditemukan di environment variable!")

# 2. FIX: Pastikan URL diawali postgresql:// bukan postgres:// (Bug lama SQLAlchemy)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. FIX: Paksa SSL Mode & Pgbouncer (Supabase Pooler Wajib ini)
# Cek apakah sudah ada query params
if "?" in DATABASE_URL:
    if "sslmode=require" not in DATABASE_URL:
        DATABASE_URL += "&sslmode=require"
else:
    DATABASE_URL += "?sslmode=require"

# 4. FIX: Khusus Supabase Transaction Pooler (Port 6543)
# Sangat disarankan pakai port 6543, bukan 5432 untuk serverless app
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True, # Cek koneksi mati
    connect_args={
        "prepare_threshold": None, # WAJIB UNTUK SUPABASE TRANSACTION POOLER
        "connect_timeout": 10
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()