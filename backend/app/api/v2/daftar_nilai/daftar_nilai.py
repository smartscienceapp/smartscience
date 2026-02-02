from fastapi import APIRouter, Depends
from sqlalchemy import desc, func
from models.models import HasilJawabanSiswa, User
from sqlalchemy.orm import Session
from app.database.session import get_db
from schemas.v2.schemas import GetDaftarNilai
import json
import math

router = APIRouter()

@router.post("/daftar_nilai")
def getDaftarNilai(user: GetDaftarNilai, db: Session = Depends(get_db)):
    # 1. Base Query (Tanpa Limit/Offset untuk menghitung Total)
    base_query = (db.query(HasilJawabanSiswa)
        .join(User, HasilJawabanSiswa.id_user == User.id_user) 
        .filter(HasilJawabanSiswa.id_tob == user.id_tob))
    
    # Hitung total items
    total_items = base_query.count()
    
    # Hitung total pages
    total_pages = math.ceil(total_items / user.limit)

    # 2. Data Query (Dengan Limit & Offset)
    offset = (user.page - 1) * user.limit
    
    results = (db.query(HasilJawabanSiswa.jawaban_siswa, HasilJawabanSiswa.nilai, User.username, User.id_user)
        .join(User, HasilJawabanSiswa.id_user == User.id_user) 
        .filter(HasilJawabanSiswa.id_tob == user.id_tob)
        .order_by(desc(HasilJawabanSiswa.id_user))
        .offset(offset)
        .limit(user.limit)
        .all())
    
    data_list = []

    for r in results:
        total_correct = 0
        final_nilai = r.nilai

        try: 
            if r.jawaban_siswa:
                jawaban_list = json.loads(r.jawaban_siswa)
                if isinstance(jawaban_list, list):
                    # Optimization: Generator expression is faster than list comprehension
                    total_correct = sum(1 for item in jawaban_list if item.get("is_correct") is True)
                else:
                     raise ValueError("Not a list")
            else:
                raise ValueError("Empty")

        except (json.JSONDecodeError, TypeError, ValueError, AttributeError): 
            total_correct = 0
            final_nilai = 0

        data_list.append({
            "nama": r.username,
            "total_correct": total_correct,
            "nilai": final_nilai,
            "id_user": r.id_user
        })
    
    # Return format baru dengan Metadata Pagination
    return {
        "data": data_list,
        "meta": {
            "page": user.page,
            "limit": user.limit,
            "total_items": total_items,
            "total_pages": total_pages
        }
    }