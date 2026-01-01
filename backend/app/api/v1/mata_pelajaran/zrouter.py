
from fastapi import APIRouter
from app.api.v1.mata_pelajaran import (
    create_mata_pelajaran,
    list_mata_pelajaran,
    delete_mata_pelajaran,
    tautkan_mata_pelajaran
)

# Buat satu router utama untuk Mata Pelajaran
mata_pelajaran_router = APIRouter()

# Masukkan router-router kecil ke sini
mata_pelajaran_router.include_router(create_mata_pelajaran.router) 
mata_pelajaran_router.include_router(list_mata_pelajaran.router)
mata_pelajaran_router.include_router(delete_mata_pelajaran.router)
mata_pelajaran_router.include_router(tautkan_mata_pelajaran.router)