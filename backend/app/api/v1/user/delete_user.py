from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import User
from schemas.v1.schemas import DeleteUser 

router = APIRouter()

@router.post("/delete_user", response_model=dict)
def delete_user(user: DeleteUser, db: Session = Depends(get_db)):
    deleted_count = db.query(User).filter(
        User.id_user == user.id_user
    ).delete(synchronize_session=False)

    db.commit()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
        
    return {"status": "success", "message": "Data berhasil dihapus"}