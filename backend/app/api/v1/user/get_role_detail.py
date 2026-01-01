from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Role 

router = APIRouter()

@router.get("/get_role_detail", response_model=dict)
def get_role_detail(db: Session = Depends(get_db)):
    roles = db.query(Role).filter(~Role.id_role.in_([1])).all()
    role_list = [{"id_role": role.id_role, "nama_role": role.nama_role} for role in roles]
    return {"roles": role_list}