from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User 

router = APIRouter()

@router.get("/last_user_create", response_model=dict)
def get_last_user_create(db: Session = Depends(get_db)):
    last_user = db.query(User).order_by(User.created_at.desc()).first()
    if not last_user:
        return {"message": "No users found"}
    return {"created_at": last_user.created_at}