
from fastapi import APIRouter
from app.api.v1.tob import (
    create_tob,
    list_tob,
    list_soal_tob,
    delete_soal_tob,
    tambah_isi_tob,
    status_pengerjaan,
    submit_pengerjaan,
    get_pengerjaan_siswa
)

# Buat satu router utama untuk Mata Pelajaran
tob_router = APIRouter()

# Masukkan router-router kecil ke sini 
tob_router.include_router(create_tob.router)
tob_router.include_router(list_tob.router)
tob_router.include_router(list_soal_tob.router)
tob_router.include_router(delete_soal_tob.router)
tob_router.include_router(tambah_isi_tob.router)
tob_router.include_router(status_pengerjaan.router)
tob_router.include_router(submit_pengerjaan.router)
tob_router.include_router(get_pengerjaan_siswa.router)