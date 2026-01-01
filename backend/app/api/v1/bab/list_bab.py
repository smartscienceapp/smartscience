from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 

from app.database.session import get_db
from models.models import Bab, MapelKelasBab
from schemas.v1.schemas import BabFind

router = APIRouter() 

@router.post("/list_bab", response_model=dict)
def list_bab(filter_data: BabFind, db: Session = Depends(get_db)):  
    if int(filter_data.id_kelas) == 0:
        results = (
            db.query(
                Bab.id_bab,
                Bab.nama_bab 
            )  
            .join(MapelKelasBab, Bab.id_bab == MapelKelasBab.id_bab)
            .filter(MapelKelasBab.id_mapel == filter_data.id_mapel)
            .distinct()
            .order_by(Bab.id_bab.desc()) 
            .all()
        )
    else :
        results = (
            db.query(
                Bab.id_bab,
                Bab.nama_bab 
            ) 
            .join(MapelKelasBab, Bab.id_bab == MapelKelasBab.id_bab) 
            .filter(MapelKelasBab.id_kelas == filter_data.id_kelas)
            .filter(MapelKelasBab.id_mapel == filter_data.id_mapel)
            .order_by(Bab.id_bab.desc()) 
            .all()
        )
    
    if not results:
        return {"message": "Tidak ditemukan bab di mata pelajaran dan kelas ini."}
    
    bab_list = [
        {
            "id_bab": row.id_bab, 
            "nama_bab": row.nama_bab,  
        }
        for row in results 
    ]
    
    return {"bab": bab_list}
