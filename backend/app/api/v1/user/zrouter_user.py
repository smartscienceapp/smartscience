
from fastapi import APIRouter
from app.api.v1.user import (
    create_user, 
    log_in, 
    total_siswa, 
    last_user_regist, 
    get_role,
    get_role_detail,
    get_kelas_detail,
    log_out,
    delete_user,
    list_user,
    total_user
)

# Buat satu router utama untuk User
user_router = APIRouter()

# Masukkan router-router kecil ke sini
user_router.include_router(create_user.router)
user_router.include_router(log_in.router)
user_router.include_router(total_siswa.router)
user_router.include_router(last_user_regist.router)
user_router.include_router(get_role.router)
user_router.include_router(get_role_detail.router)
user_router.include_router(get_kelas_detail.router)
user_router.include_router(log_out.router)
user_router.include_router(list_user.router)
user_router.include_router(delete_user.router)
user_router.include_router(total_user.router)