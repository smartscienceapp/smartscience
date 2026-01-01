from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Soal, SoalTOB, TOB, Bab
from schemas.v1.schemas import GetDetailSoalFull, GetDetailSoal, SoalFindByTOBBab

router = APIRouter() 
@router.post("/get_detail_soal", response_model=dict)
def get_detail_soal(user: GetDetailSoal, db: Session = Depends(get_db)):
    results = (
        db.query(
            Soal.id_soal,
            Soal.isi_soal,
            Soal.image_soal,
            Soal.option
        )
        .filter(Soal.id_soal == user.id_soal)
        .first()
    )
    
    if not results:
        return {"message": "No soal found for the specified criteria"} 
    
    return {
        "id_soal": results.id_soal,
        "isi_soal": results.isi_soal,
        "image_soal": results.image_soal,
        "option": results.option
    }
    
@router.post("/get_detail_soal_full", response_model=dict)
def get_detail_soal_full(user: GetDetailSoalFull, db: Session = Depends(get_db)):
    results = (
        db.query(
            Soal.id_soal,
            Soal.isi_soal,
            Soal.image_soal,
            Soal.option
        ).join(SoalTOB, Soal.id_soal == SoalTOB.id_soal)
        .join(TOB, SoalTOB.id_tob == TOB.id_tob)
        .filter(TOB.id_tob == user.id_tob)
        .order_by(Soal.id_soal.asc())
        .all()
    )
    
    if not results:
        return {"message": "No soal found for the specified criteria"} 
    
    soal_list = [
        {
            "id_soal": row.id_soal,
            "isi_soal": row.isi_soal,
            "image_soal": row.image_soal,
            "option": row.option
        }
        for row in results
    ]
    
    return {"soaltob": soal_list, "message": "Success"} 