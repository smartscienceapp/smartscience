from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User, Role
from app.core.security import verify_password, create_access_token
from schemas.v1.schemas import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # 1. Cari user
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # 2. Verifikasi Password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    nama_role = db.query(Role).filter(Role.id_role == user.id_role).first() 
    id_kelas = user.id_kelas
    id_user = user.id_user
    
    user.is_active = True
    
    db.commit()
    # 3. Buat Token
    access_token = create_access_token(data={"user": user.username, "role": nama_role.nama_role,"id_kelas": id_kelas, "id_user": id_user}, )
    return {"access_token": access_token, "token_type": "bearer"}