from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import Soal
from schemas.v1.schemas import DeleteSoal 

router = APIRouter()

@router.post("/delete_soal", response_model=dict)
def delete_user(input: DeleteSoal, db: Session = Depends(get_db)):
    deleted_count = db.query(Soal).filter(
        Soal.id_soal == input.id_soal, 
    ).delete(synchronize_session=False)

    db.commit()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")
        
    return {"status": "success", "message": "Data berhasil dihapus"}