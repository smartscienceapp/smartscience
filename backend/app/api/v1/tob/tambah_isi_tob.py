from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import TOB, Soal, SoalTOB
from schemas.v1.schemas import AddSoalTOB  

router = APIRouter()

@router.post("/tambah_soal_tob", response_model=dict)
def create_tob(user: AddSoalTOB, db: Session = Depends(get_db)):   
    try:   
        new_tob = SoalTOB(
            id_soal = user.id_soal,
            id_tob = user.id_tob, 
            created_by = user.created_by
        )
        
        db.add(new_tob) 
        db.commit()
        db.refresh(new_tob)
        return {
            "message": "Soal inserted to TOB successfully",
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")    