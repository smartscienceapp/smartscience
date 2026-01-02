from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from models.models import HasilJawabanSiswa, User, Soal
from schemas.v1.schemas import SubmitPengerjaanRequest   
import json

router = APIRouter() 

@router.post("/submit_pengerjaan")
def submit_pengerjaan(data: SubmitPengerjaanRequest, db: Session = Depends(get_db)):   
    try:    
        # --- 1. Validasi User ---
        user_check = db.query(User).filter(User.id_user == data.id_user).first()
        if not user_check:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_check.id_user

        # --- 2. Parse Jawaban Siswa ---
        try:
            jawaban_list = json.loads(data.jawaban_siswa)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format in jawaban_siswa")

        # --- 3. Logika Bisnis (Validasi Server-Side) ---
        
        # Ambil semua ID soal untuk query sekaligus
        list_id_soal = [item.get("id_soal") for item in jawaban_list]
        soal_db_list = db.query(Soal).filter(Soal.id_soal.in_(list_id_soal)).all()
        soal_map = {soal.id_soal: soal for soal in soal_db_list}

        total_benar = 0
        total_soal = len(jawaban_list)
        verified_jawaban_list = []

        for item in jawaban_list:
            id_soal = item.get("id_soal")
            jawaban_user = item.get("jawaban") # Asumsi format: "A", "B", "C", dst.
            
            soal_db = soal_map.get(id_soal)
            is_correct = False 
            
            if soal_db:
                try:
                    # Load string JSON dari DB
                    # Struktur: [{"text": "...", "image": "", "isCorrect": boolean}, ...]
                    options_db = json.loads(soal_db.option)
                    
                    kunci_jawaban_huruf = None
                    
                    # Loop untuk mencari index yang benar
                    for idx, opt in enumerate(options_db):
                        # [FIX] Menggunakan key 'isCorrect' sesuai create_soal/page.tsx
                        if opt.get("isCorrect") is True:
                            # Konversi Index ke Huruf (0 -> A, 1 -> B) agar sesuai input user
                            kunci_jawaban_huruf = chr(65 + idx)
                            break
                    
                    # Bandingkan jawaban user ("A") dengan kunci hasil konversi ("A")
                    if kunci_jawaban_huruf and jawaban_user == kunci_jawaban_huruf:
                        is_correct = True
                        total_benar += 1
                        
                except Exception as parse_err:
                    print(f"Error parsing option soal {id_soal}: {parse_err}")
            
            # Override status is_correct dengan hasil validasi server
            item['is_correct'] = is_correct 
            verified_jawaban_list.append(item)

        # Hitung Nilai
        nilai = (total_benar / total_soal * 100) if total_soal > 0 else 0
        nilai = round(nilai, 2)

        # --- 4. Simpan ke Database ---
        new_hasil = HasilJawabanSiswa(
            id_user=user_id,
            id_tob=data.id_tob,
            # Simpan data yang sudah diverifikasi (Sanitized)
            jawaban_siswa=json.dumps(verified_jawaban_list), 
            nilai=nilai,
            created_by=data.created_by
        )
        
        db.add(new_hasil) 
        db.commit()
        db.refresh(new_hasil)
        
        return {
            "message": "Jawaban berhasil disubmit",
            "nilai": nilai,
            "total_benar": total_benar,
            "detail_hasil": verified_jawaban_list 
        }   
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print(f"Error Submit: {str(e)}") 
        raise HTTPException(status_code=400, detail=f"Database Error: {str(e)}")