from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import TOB, MataPelajaran, MapelKelas
from schemas.v1.schemas import TOBCreate  

router = APIRouter()

@router.post("/create_tob", response_model=dict)
def create_tob(user: TOBCreate, db: Session = Depends(get_db)):   
    try:   
        new_tob = TOB(
            nama_tob = user.nama_tob,
            id_kelas = user.id_kelas, 
            id_mapel = user.id_mapel,
            created_by = user.created_by
        )
        
        db.add(new_tob) 
        db.commit()
        db.refresh(new_tob)
        return {
            "message": "TOB created successfully",
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")    