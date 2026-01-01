from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import HasilJawabanSiswa
from schemas.v1.schemas import GetPengerjaanSiswa

router = APIRouter() 
@router.post("/get_pengerjaan_siswa", response_model=dict)
def get_pengerjaan_siswa(user: GetPengerjaanSiswa, db: Session = Depends(get_db)):
    results = (
        db.query(
            HasilJawabanSiswa.jawaban_siswa,
            HasilJawabanSiswa.nilai
        )
        .filter(HasilJawabanSiswa.id_user == user.id_user)
        .filter(HasilJawabanSiswa.id_tob == user.id_tob)
        .first()
    )
    
    if not results:
        return {"message": "No jawaban found for the specified criteria"} 
    
    return {
        "jawaban_siswa": results.jawaban_siswa,
        "nilai": results.nilai 
    } 