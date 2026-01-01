from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Bab, MapelKelasBab
from schemas.v1.schemas import BabCreate  

router = APIRouter()

@router.post("/create_bab", response_model=dict)
def create_bab(user: BabCreate, db: Session = Depends(get_db)):   
    try: 
        db_query = db.query(Bab).filter(Bab.nama_bab == user.nama_bab).first()
        if db_query:
            raise HTTPException(status_code=400, detail="Bab sudah ada")

        new_bab = Bab(
            nama_bab=user.nama_bab, 
            created_by=user.created_by
        )
        
        db.add(new_bab) 
        
        db.flush()
        
        id_bab = new_bab.id_bab
        
        new_mapel_kelas_bab = MapelKelasBab(
            id_bab = id_bab,
            id_mapel=user.id_mapel,
            id_kelas=user.id_kelas,
            created_by=user.created_by
        )
        
        db.add(new_mapel_kelas_bab)
        
        db.commit()
        db.refresh(new_bab)
        db.refresh(new_mapel_kelas_bab)
        return {
            "message": "Mata pelajaran berhasil dibuat", 
            "nama_kelas": new_bab.nama_bab,
            "id_mapel": new_mapel_kelas_bab.id_mapel,
            "id_kelas": new_mapel_kelas_bab.id_kelas,
            "id_mapel_kelas_bab": new_mapel_kelas_bab.id_mapel_kelas_bab
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")    