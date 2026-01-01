from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Bab
from schemas.v1.schemas import DeleteBab  

router = APIRouter()

@router.post("/delete_bab", response_model=dict)
def delete_bab(user: DeleteBab, db: Session = Depends(get_db)):   
    deleted_count = db.query(Bab).filter(Bab.id_bab == user.id_bab).delete(synchronize_session=False)
     
    db.commit()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data Bab tidak ditemukan")
        
    return {"status": "success", "message": "Data Bab berhasil dihapus"}