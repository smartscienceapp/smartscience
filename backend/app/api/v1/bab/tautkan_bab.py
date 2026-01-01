from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import MapelKelasBab
from schemas.v1.schemas import TautkanBab  

router = APIRouter()

@router.post("/tautkan_bab", response_model=dict)
def tautkan_bab(user: TautkanBab, db: Session = Depends(get_db)):   
    try: 
        db_query = db.query(MapelKelasBab).filter(MapelKelasBab.id_mapel == user.id_mapel).filter(MapelKelasBab.id_kelas == user.id_kelas).filter(MapelKelasBab.id_bab == user.id_bab).first()
        if db_query:
            raise HTTPException(status_code=400, detail="Bab sudah tertaut ke mata pelajaran dan kelas ini")
        
        new_mapel_kelas_bab = MapelKelasBab(
            id_mapel=user.id_mapel,
            id_kelas=user.id_kelas,
            id_bab=user.id_bab,
            created_by=user.created_by
        )
        
        db.add(new_mapel_kelas_bab)
        
        db.commit() 
        db.refresh(new_mapel_kelas_bab)
        return {
            "message": "Mata pelajaran berhasil tertaut ke kelas ini",  
            "id_bab": new_mapel_kelas_bab.id_mapel,
            "id_mapel_kelas_bab": new_mapel_kelas_bab.id_mapel_kelas_bab
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")