from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, not_
# Ensure your models are imported correctly
from models.models import HasilJawabanSiswa, TOB, MataPelajaran
from app.database.session import get_db 

router = APIRouter()

@router.get("/rata_rata_nilai")
def get_rata_rata_nilai(db: Session = Depends(get_db)):
    # Query: Select Mapel Name and Average Score
    results = (db.query(
            MataPelajaran.nama_mapel,
            func.avg(HasilJawabanSiswa.nilai).label("average_score")
        )
        .join(TOB, HasilJawabanSiswa.id_tob == TOB.id_tob)
        .join(MataPelajaran, TOB.id_mapel == MataPelajaran.id_mapel)
        # FILTER: Exclude any mapel containing 'trial' (case-insensitive)
        .filter(not_(MataPelajaran.nama_mapel.ilike("%trial%")))
        # GROUP: Collapse rows by subject
        .group_by(MataPelajaran.nama_mapel)
        # SORT: Alphabetical A-Z
        .order_by(asc(MataPelajaran.nama_mapel))
        .all())
    
    # Transformation: Format for JSON response
    # Note: 'average_score' might return as Decimal or Float depending on your DB (Postgres vs MySQL).
    # We cast to float() to ensure JSON serialization compatibility.
    return [
        {
            "rata": round(float(r.average_score), 2) if r.average_score is not None else 0, 
            "mapel": r.nama_mapel
        } 
        for r in results
    ]