from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import SoalTOB
from schemas.v1.schemas import DeleteSoalTOB  

router = APIRouter()

@router.post("/delete_soal_tob", response_model=dict)
def delete_soal_tob(user: DeleteSoalTOB, db: Session = Depends(get_db)):
    deleted_count = db.query(SoalTOB).filter(
        SoalTOB.id_tob == user.id_tob,
        SoalTOB.id_soal == user.id_soal
    ).delete(synchronize_session=False)

    db.commit()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
        
    return {"status": "success", "message": "Data berhasil dihapus"}