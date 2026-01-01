from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 

from app.database.session import get_db
from models.models import MataPelajaran, MapelKelas
from schemas.v1.schemas import MapelFind

router = APIRouter() 

@router.post("/list_mapel", response_model=dict)
def list_mapel(user : MapelFind, db: Session = Depends(get_db)):  
    if int(user.id_kelas) == 0:
        results = (
            db.query(
                MataPelajaran.id_mapel,
                MataPelajaran.nama_mapel 
            )  
            .order_by(MataPelajaran.id_mapel.desc()) 
            .all()
        )
    else :
        results = (
            db.query(
                MataPelajaran.id_mapel,
                MataPelajaran.nama_mapel 
            ) 
            .join(MapelKelas, MataPelajaran.id_mapel == MapelKelas.id_mapel)
            .filter(MapelKelas.id_kelas == user.id_kelas)
            .order_by(MataPelajaran.id_mapel.desc()) 
            .all()
        )
    
    if not results:
        return {"message": "Tidak ditemukan mata pelajaran di kelas ini."}
    
    mapel_list = [
        {
            "id_mapel": row.id_mapel, 
            "nama_mapel": row.nama_mapel,  
        }
        for row in results 
    ]
    
    return {"mapel": mapel_list}

