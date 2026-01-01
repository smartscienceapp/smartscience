from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Kelas 

router = APIRouter()

@router.get("/get_kelas_detail", response_model=dict)
def get_kelas_detail(db: Session = Depends(get_db)):
    kelas = (
        db.query(Kelas)
        .filter(~Kelas.id_kelas.in_([1, 2]))
        .all()
    ) 
    kelas_list = [
        {"id_kelas": k.id_kelas, "nama_kelas": k.nama_kelas}
        for k in kelas
    ]  
    return {"kelas": kelas_list}
