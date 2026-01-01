from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Soal, MataPelajaran, MapelKelas
from schemas.v1.schemas import SoalCreate, SoalUpdate

router = APIRouter()

@router.post("/create_soal", response_model=dict)
def create_soal(user: SoalCreate, db: Session = Depends(get_db)):   
    try:    
        new_soal = Soal(
            id_bab = user.id_bab, 
            isi_soal = user.isi_soal,
            image_soal = user.image_soal,
            option = user.option,
            created_by = user.created_by
        )
        
        db.add(new_soal) 
        db.commit()
        db.refresh(new_soal)
        return {
            "message": "Soal created successfully",
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")    
    
@router.post("/update_soal", response_model=dict)
def update_soal(data: SoalUpdate, db: Session = Depends(get_db)):   
    try:    
        soal = db.query(Soal).filter(Soal.id_soal == data.id_soal).first() 
        if not soal:
            raise HTTPException(status_code=404, detail="Soal not found")

        # Update hanya field yang dikirim (tidak None)
        if data.isi_soal is not None:
            soal.isi_soal = data.isi_soal
        if data.image_soal is not None:
            soal.image_soal = data.image_soal
        if data.option is not None:
            soal.option = data.option
            
        db.commit()
        db.refresh(soal)
        return {
            "message": "Soal updated successfully",
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")    