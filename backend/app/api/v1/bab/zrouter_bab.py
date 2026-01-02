
from fastapi import APIRouter
from app.api.v1.bab import ( 
    create_bab,
    list_bab,
    delete_bab,
    tautkan_bab
)

# Buat satu router utama untuk Mata Pelajaran
bab_router = APIRouter()

# Masukkan router-router kecil ke sini
bab_router.include_router(create_bab.router) 
bab_router.include_router(list_bab.router)
bab_router.include_router(delete_bab.router)
bab_router.include_router(tautkan_bab.router)