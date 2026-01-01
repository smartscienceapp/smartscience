from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import MataPelajaran, MapelKelas
from schemas.v1.schemas import MataPelajaranCreate  

router = APIRouter()

@router.post("/create_mapel", response_model=dict)
def create_mapel(user: MataPelajaranCreate, db: Session = Depends(get_db)):   
    try: 
        db_query = db.query(MataPelajaran).filter(MataPelajaran.nama_mapel == user.nama_mapel).first()
        if db_query:
            raise HTTPException(status_code=400, detail="Mata pelajaran sudah ada")

        new_mapel = MataPelajaran(
            nama_mapel=user.nama_mapel, 
            created_by=user.created_by
        )
        
        db.add(new_mapel) 
        
        db.flush()
        
        id_mapel = new_mapel.id_mapel
        
        new_mapel_kelas = MapelKelas(
            id_mapel=id_mapel,
            id_kelas=user.id_kelas,
            created_by=user.created_by
        )
        
        db.add(new_mapel_kelas)
        
        db.commit()
        db.refresh(new_mapel)
        db.refresh(new_mapel_kelas)
        return {
            "message": "Mata pelajaran berhasil dibuat", 
            "nama_kelas": new_mapel.nama_mapel,
            "id_mapel": new_mapel.id_mapel,
            "id_kelas": new_mapel_kelas.id_mapel_kelas
        }   
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")    