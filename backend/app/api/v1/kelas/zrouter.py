
from fastapi import APIRouter
from app.api.v1.kelas import (
    create_kelas, 
    list_kelas,
    delete_kelas
)

# Buat satu router utama untuk Kelas
kelas_router = APIRouter()

# Masukkan router-router kecil ke sini
kelas_router.include_router(create_kelas.router)
kelas_router.include_router(list_kelas.router)  
kelas_router.include_router(delete_kelas.router)