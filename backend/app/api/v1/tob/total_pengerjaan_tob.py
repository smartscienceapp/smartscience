from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from models.models import HasilJawabanSiswa 
from datetime import datetime, timedelta, timezone # Import tambahan

router = APIRouter()

@router.get("/total_pengerjaan_tob", response_model=dict)
def total_pengerjaan_tob(db: Session = Depends(get_db)):
    # 1. Ambil waktu sekarang dalam UTC (karena DB kamu +00)
    now = datetime.now(timezone.utc)
    
    # 2. Cari hari Senin minggu ini
    # weekday(): Senin = 0, Minggu = 6
    start_of_week = now - timedelta(days=now.weekday())
    
    # 3. Reset jam ke 00:00:00 untuk awal minggu
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    # 4. Query
    total_siswa = db.query(
        HasilJawabanSiswa.id_user,
        HasilJawabanSiswa.id_tob
    ).filter(
        HasilJawabanSiswa.created_at >= start_of_week  # Filter minggu ini
    ).distinct().count() # Hitung kombinasi unik user & tob
    
    return {"total_siswa": total_siswa}