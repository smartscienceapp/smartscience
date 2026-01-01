from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# Import semua model yang dibutuhkan untuk Join
from app.database.session import get_db
from models.models import TOB, SoalTOB, Soal, MataPelajaran, MapelKelas, Kelas
from schemas.v1.schemas import SoalFindByTOB

router = APIRouter() 
@router.post("/post/list_soal_tob", response_model=dict)
def list_tob(user: SoalFindByTOB, db: Session = Depends(get_db)):  
    results = (
        db.query(
            Soal.id_soal,
            Soal.isi_soal,
            MataPelajaran.nama_mapel,
            Kelas.nama_kelas
        )
        .join(SoalTOB, Soal.id_soal == SoalTOB.id_soal)  
        .join(TOB, SoalTOB.id_tob == TOB.id_tob)
        .join(MataPelajaran, TOB.id_mapel == MataPelajaran.id_mapel)
        .join(MapelKelas, MataPelajaran.id_mapel == MapelKelas.id_mapel)
        .join(Kelas, MapelKelas.id_kelas == Kelas.id_kelas)
        .filter(SoalTOB.id_tob == user.id_tob)
        .order_by(Soal.id_soal.asc())
        .all()
    )
    
    if not results:
        return {"message": "No soal found for the specified criteria"}
    
    tob_list = [
        {
            "id_soal": row.id_soal, 
            "isi_soal": row.isi_soal,
            "nama_mapel": row.nama_mapel, 
            "nama_kelas": row.nama_kelas,
        }
        for row in results 
    ]
    
    return {"soaltob": tob_list}  

