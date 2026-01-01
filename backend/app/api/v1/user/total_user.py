from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User 

router = APIRouter()

@router.get("/total_user", response_model=dict)
def get_total_user(db: Session = Depends(get_db)):
    total_siswa = db.query(User).filter(User.is_active == True).count()
    return {"total_user": total_siswa}