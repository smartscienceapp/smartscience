
from fastapi import APIRouter
from app.api.v1.soal import (
    create_soal,
    get_detail_soal,
    list_soal,
    delete_soal
)

# Buat satu router utama untuk Mata Pelajaran
soal_router = APIRouter()

# Masukkan router-router kecil ke sini 
soal_router.include_router(create_soal.router)
soal_router.include_router(get_detail_soal.router)
soal_router.include_router(list_soal.router)
soal_router.include_router(delete_soal.router)

