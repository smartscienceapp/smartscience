from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User, Kelas
from schemas.v1.schemas import UserFilter


router = APIRouter()

@router.post("/list_user", response_model=dict)
def list_user(filter_data: UserFilter, db: Session = Depends(get_db)):
    # Base Query
    query = db.query(
        User.id_user, 
        User.username,
        Kelas.nama_kelas
    ).join(Kelas, User.id_kelas == Kelas.id_kelas).filter(User.id_role == filter_data.id_role)

    # Filter by Kelas (jika ada)
    if filter_data.id_kelas:
        query = query.filter(User.id_kelas == filter_data.id_kelas)

    # Filter by Search (jika ada)
    if filter_data.search:
        query = query.filter(User.username.ilike(f"%{filter_data.search}%"))

    # Hitung total data (untuk pagination frontend)
    total_items = query.count()
    
    # Apply Pagination (Offset & Limit)
    users = query.offset((filter_data.page - 1) * filter_data.limit).limit(filter_data.limit).all()

    result = [
        {
            "id_user": row.id_user,
            "username": row.username,
            "nama_kelas": row.nama_kelas
        }
        for row in users
    ]
    
    # Return data beserta info pagination
    return {
        "users": result,
        "total_items": total_items,
        "total_pages": (total_items + filter_data.limit - 1) // filter_data.limit,
        "current_page": filter_data.page
    }
