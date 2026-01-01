from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import MapelKelas
from schemas.v1.schemas import TautkanMapel  

router = APIRouter()

@router.post("/tautkan_mapel", response_model=dict)
def tautkan_mapel(user: TautkanMapel, db: Session = Depends(get_db)):   
    try: 
        db_query = db.query(MapelKelas).filter(MapelKelas.id_mapel == user.id_mapel).filter(MapelKelas.id_kelas == user.id_kelas).first()
        if db_query:
            raise HTTPException(status_code=400, detail="Mata pelajaran sudah tertaut ke kelas ini")
        
        new_mapel_kelas = MapelKelas(
            id_mapel=user.id_mapel,
            id_kelas=user.id_kelas,
            created_by=user.created_by
        )
        
        db.add(new_mapel_kelas)
        
        db.commit() 
        db.refresh(new_mapel_kelas)
        return {
            "message": "Mata pelajaran berhasil tertaut ke kelas ini",  
            "id_mapel": new_mapel_kelas.id_mapel,
            "id_kelas": new_mapel_kelas.id_mapel_kelas
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")