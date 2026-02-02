from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session 
from math import ceil

from app.database.session import get_db
from models.models import Soal
from schemas.v1.schemas import SoalFind 

router = APIRouter() 

@router.post("/list_soal", response_model=dict)
def list_soal(filter_data: SoalFind, db: Session = Depends(get_db)):  
    # 1. Base Query
    query = db.query(
        Soal.id_soal, 
        Soal.isi_soal.label("nama_soal")
    ).filter(Soal.id_bab == filter_data.id_bab)

    # 2. Apply Search Filter (if exists)
    if filter_data.search:
        query = query.filter(Soal.isi_soal.ilike(f"%{filter_data.search}%"))

    # 3. Calculate Total for Pagination Metadata
    total_items = query.count()
    
    # 4. Apply Pagination (Limit & Offset)
    offset = (filter_data.page - 1) * filter_data.limit
    results = query.order_by(Soal.id_soal.asc()).offset(offset).limit(filter_data.limit).all()
    
    # 5. Format Data
    soal_list = [
        {
            "id_soal": row.id_soal, 
            "nama_soal": row.nama_soal  
        }
        for row in results 
    ]
    
    # 6. Return Data + Pagination Info
    return {
        "data": soal_list,
        "pagination": {
            "total_items": total_items,
            "total_pages": ceil(total_items / filter_data.limit),
            "current_page": filter_data.page,
            "limit": filter_data.limit
        }
    }
