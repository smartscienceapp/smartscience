from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Kelas
from schemas.v1.schemas import KelasCreate  

router = APIRouter()

@router.post("/create_kelas", response_model=dict)
def create_kelas(user: KelasCreate, db: Session = Depends(get_db)):   
    try: 
        db_query = db.query(Kelas).filter(Kelas.nama_kelas == user.nama_kelas).first()
        if db_query:
            raise HTTPException(status_code=400, detail="Kelas sudah ada.")

        new_kelas = Kelas(
            nama_kelas=user.nama_kelas, 
            created_by=user.created_by
        )
        
        db.add(new_kelas) 
        db.commit()
        db.refresh(new_kelas)
        return {
            "message": "Kelas berhasil dibuat.", 
            "nama_kelas": new_kelas.nama_kelas,
            "id_kelas": new_kelas.id_kelas
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")    