from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 

from app.database.session import get_db
from models.models import Soal
from schemas.v1.schemas import SoalFind

router = APIRouter() 

@router.post("/list_soal", response_model=dict)
def list_soal(filter_data: SoalFind, db: Session = Depends(get_db)):  
    results = (
        db.query(
            Soal.id_soal,
            Soal.isi_soal.label("nama_soal")
        )  
        .filter(Soal.id_bab == filter_data.id_bab)
        .order_by(Soal.id_soal.desc()) 
        .all()
    )
    
    if not results:
        return {"message": "Tidak ditemukan soal di bab, mata pelajaran dan kelas ini."}
    
    soal_list = [
        {
            "id_soal": row.id_soal, 
            "nama_soal": row.nama_soal  
        }
        for row in results 
    ]
    
    return {"soal": soal_list}
