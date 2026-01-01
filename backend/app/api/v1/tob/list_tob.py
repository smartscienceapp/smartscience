from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# Import semua model yang dibutuhkan untuk Join
from app.database.session import get_db
from models.models import MataPelajaran, MapelKelas, TOB, Kelas
from schemas.v1.schemas import TOBFind

router = APIRouter() 

# -------------------------------------------------------
# ENDPOINT 1: POST (Filter by mapel)
# -------------------------------------------------------
@router.post("/post/list_tob", response_model=dict)
def list_tob(user: TOBFind, db: Session = Depends(get_db)):  
    results = (
        db.query(
            TOB.id_tob,
            TOB.nama_tob,
            MataPelajaran.nama_mapel,
            Kelas.nama_kelas
        )
        .join(MataPelajaran, TOB.id_mapel == MataPelajaran.id_mapel)
        .join(MapelKelas, MataPelajaran.id_mapel == MapelKelas.id_mapel) # Jembatan
        .join(Kelas, MapelKelas.id_kelas == Kelas.id_kelas)
        .filter(MataPelajaran.id_mapel == user.id_mapel)
        .filter(Kelas.id_kelas == user.id_kelas)
        .order_by(TOB.id_tob.desc())
        .all()
    )
    
    if not results:
        return {"message": "No subjects found for the specified criteria"}
    
    tob_list = [
        {
            "id_tob": row.id_tob, 
            "nama_tob": row.nama_tob,
            "nama_mapel": row.nama_mapel, 
            "nama_kelas": row.nama_kelas
        }
        for row in results 
    ]
    
    return {"tob": tob_list}

# -------------------------------------------------------
# ENDPOINT 2: GET (Get All)
# -------------------------------------------------------
@router.get("/get/list_tob", response_model=dict)
def get_list_tob(db: Session = Depends(get_db)):
    # Logic sama: Perlu join sampai ke Kelas untuk dapat nama_kelas
    results = (
        db.query(
            TOB.id_tob,
            TOB.nama_tob,
            MataPelajaran.nama_mapel,
            Kelas.nama_kelas
        )
        .join(MataPelajaran, TOB.id_mapel == MataPelajaran.id_mapel)
        .join(MapelKelas, MataPelajaran.id_mapel == MapelKelas.id_mapel)
        .join(Kelas, MapelKelas.id_kelas == Kelas.id_kelas)
        .order_by(TOB.id_tob.desc())
        .limit(10)
        .all()
    )
    
    if not results:
        return {"message": "No subjects found"}
    
    tob_list = [
        {
            "id_tob": row.id_tob, 
            "nama_tob": row.nama_tob,
            "nama_mapel": row.nama_mapel,
            "nama_kelas": row.nama_kelas
        }
        for row in results
    ]
    
    return {"tob": tob_list}


