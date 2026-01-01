from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User
from models.models import Kelas
from models.models import Role
from schemas.v1.schemas import UserCreate 
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/create_user", response_model=dict)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try :
        db_query = db.query(User).filter(User.username == user.username).first()
        if db_query:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        hashed_password = get_password_hash(user.password)
        new_user = User(
            username=user.username,
            hashed_password=hashed_password,
            id_role=user.id_role, 
            id_kelas=user.id_kelas,
            created_by=user.created_by
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"message": "User created successfully", "username": new_user.username}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Database Error")
    