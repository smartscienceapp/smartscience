from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 

from app.database.session import get_db
from models.models import Kelas 

router = APIRouter() 

@router.post("/list_kelas", response_model=dict)
def list_kelas(db: Session = Depends(get_db)):  
    results = (
        db.query(
            Kelas.id_kelas,
            Kelas.nama_kelas, 
        ) 
        .filter(~Kelas.id_kelas.in_([1, 2]))
        .order_by(Kelas.id_kelas.desc()) 
        .all()
    )
    
    if not results:
        return {"message": "Tidak ada kelas ditemukan."}
    
    kelas_list = [
        {
            "id_kelas": row.id_kelas, 
            "nama_kelas": row.nama_kelas,  
        }
        for row in results 
    ]
    
    return {"kelas": kelas_list}

