
from fastapi import APIRouter
from app.api.v2.daftar_nilai import (  
    daftar_nilai,
    rata_rata_nilai,
)

daftar_nilai_router = APIRouter()

daftar_nilai_router.include_router(daftar_nilai.router)
daftar_nilai_router.include_router(rata_rata_nilai.router)