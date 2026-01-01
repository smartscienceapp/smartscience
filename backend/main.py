from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from app.core.config import settings  
from app.database.session import engine_database
from app.database.base import Base
from app.api.v1.user.zrouter import user_router
from app.api.v1.kelas.zrouter import kelas_router
from app.api.v1.mata_pelajaran.zrouter import mata_pelajaran_router
from app.api.v1.soal.zrouter import soal_router
from app.api.v1.tob.zrouter import tob_router
from app.api.v1.bab.zrouter import bab_router


Base.metadata.create_all(bind=engine_database) 

# Inisialisasi App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API SmartScience",
    version="1.0.0"
)

# Setup CORS (Agar frontend Vue/React/Angular bisa akses)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://hilarious-chebakia-ffa7e3.netlify.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRASI ROUTER --- 
app.include_router(
    user_router, 
    prefix="/api/v1/users", 
    tags=["Users"]
) 
app.include_router(
    kelas_router, 
    prefix="/api/v1/kelas", 
    tags=["Kelas"]
)
app.include_router(
    mata_pelajaran_router, 
    prefix="/api/v1/mapel", 
    tags=["Mata Pelajaran"]
) 
app.include_router(
    bab_router,
    prefix="/api/v1/bab",
    tags=["Bab"]
)
app.include_router(
    soal_router,
    prefix="/api/v1/soal",
    tags=["Soal"]
)
app.include_router(
    tob_router,
    prefix="/api/v1/tob",
    tags=["TOB"]
)

# Health Check sederhana
@app.get("/")
def root():
    return {
        "message": "Service is running", 
        "docs": "/docs"
    }