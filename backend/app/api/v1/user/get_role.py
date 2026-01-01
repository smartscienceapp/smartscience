from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User

router = APIRouter()

@router.get("/get_role", response_model=dict)
def get_role(
    username: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id_role": user.id_role, 
        "nama_role": user.role_detail.nama_role
    }
