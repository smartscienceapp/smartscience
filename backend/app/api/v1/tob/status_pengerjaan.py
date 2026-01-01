from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# Import semua model yang dibutuhkan untuk Join
from app.database.session import get_db
from models.models import HasilJawabanSiswa
from schemas.v1.schemas import StatusPengerjaan

router = APIRouter() 
@router.post("/status_pengerjaan", response_model=dict)
def status_pengerjaan(user: StatusPengerjaan, db: Session = Depends(get_db)):  
    results = (
        db.query(
            HasilJawabanSiswa.id_user,
            HasilJawabanSiswa.id_tob, 
        )
        .filter(HasilJawabanSiswa.id_user == user.id_user)
        .filter(HasilJawabanSiswa.id_tob == user.id_tob)
        .first()
    )
    
    if not results:
        return {"message": "Belum Mengerjakan"}  
    
    return {"message": "Sudah Mengerjakan"}  

