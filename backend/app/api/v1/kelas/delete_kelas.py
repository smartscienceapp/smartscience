from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Kelas
from schemas.v1.schemas import DeleteKelas  

router = APIRouter()

@router.post("/delete_kelas", response_model=dict)
def delete_kelas(user: DeleteKelas, db: Session = Depends(get_db)):   
    deleted_count = db.query(Kelas).filter(Kelas.id_kelas == user.id_kelas).delete(synchronize_session=False)
     
    db.commit()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data Kelas tidak ditemukan")
        
    return {"status": "success", "message": "Data kelas berhasil dihapus"}