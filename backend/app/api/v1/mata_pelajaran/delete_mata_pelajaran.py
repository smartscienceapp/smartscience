from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import MataPelajaran
from schemas.v1.schemas import DeleteMapel  

router = APIRouter()

@router.post("/delete_mapel", response_model=dict)
def delete_mapel(user: DeleteMapel, db: Session = Depends(get_db)):   
    deleted_count = db.query(MataPelajaran).filter(MataPelajaran.id_mapel == user.id_mapel).delete(synchronize_session=False)
     
    db.commit()

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data mata pelajaran tidak ditemukan")
        
    return {"status": "success", "message": "Data mata pelajaran berhasil dihapus"}