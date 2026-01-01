from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User
from schemas.v1.schemas import UserCreate 
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/total_siswa", response_model=dict)
def get_total_siswa(db: Session = Depends(get_db)):
    total_siswa = db.query(User).filter(User.is_active == True).count()
    return {"total_siswa": total_siswa}