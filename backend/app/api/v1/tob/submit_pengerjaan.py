from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import HasilJawabanSiswa, User
from schemas.v1.schemas import SubmitPengerjaanRequest   
import json

router = APIRouter() 




@router.post("/submit_pengerjaan")
def submit_pengerjaan(data: SubmitPengerjaanRequest, db: Session = Depends(get_db)):   
    try:   
        # --- 1. Resolve ID User (Handle jika dikirim username string atau ID string) ---
        if data.id_user.isdigit():
            user_id = int(data.id_user)
        else:
            user_check = db.query(User).filter(User.username == data.id_user).first()
            if not user_check:
                raise HTTPException(status_code=404, detail="User not found")
            user_id = user_check.id_user

        # --- 2. Parse Jawaban (String JSON -> List Python) ---
        try:
            jawaban_list = json.loads(data.jawaban_siswa)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format in jawaban_siswa")

        # --- 3. Logika Bisnis (Hitung Nilai) ---
        total_soal = len(jawaban_list)
        # Akses dictionary karena hasil load json adalah dict, bukan object pydantic
        total_benar = sum(1 for item in jawaban_list if item.get("is_correct") is True)
        nilai = (total_benar / total_soal * 100) if total_soal > 0 else 0
        nilai = round(nilai, 2)

        # --- 4. Simpan ke Database menggunakan SQLAlchemy Model ---
        # Gunakan 'HasilJawabanSiswa' (Model DB), BUKAN 'SubmitPengerjaan' (Schema)
        new_hasil = HasilJawabanSiswa(
            id_user=user_id,
            id_tob=data.id_tob,
            jawaban_siswa=data.jawaban_siswa, # Menyimpan string asli dari frontend
            nilai=nilai,                # Menyimpan nilai hasil hitungan
            created_by=data.created_by
        )
        
        db.add(new_hasil) 
        db.commit()
        db.refresh(new_hasil)
        
        return {
            "message": "Jawaban berhasil disubmit",
            "nilai": nilai,
            "total_benar": total_benar
        }   
    except Exception as e:
        db.rollback()
        print(f"Error Submit: {str(e)}") # Print error di console backend untuk debug
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")
