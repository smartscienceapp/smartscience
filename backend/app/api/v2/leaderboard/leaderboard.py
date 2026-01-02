from fastapi import APIRouter, Depends
from sqlalchemy import desc
from models.models import HasilJawabanSiswa, User
from sqlalchemy.orm import Session
from app.database.session import get_db
from schemas.v2.schemas import GetLeaderboard

router = APIRouter()

# Ubah ke @router.post
@router.post("/leaderboard_tob")
def get_leaderboard(user: GetLeaderboard,db: Session = Depends(get_db)):
    results = (db.query(HasilJawabanSiswa, User.username)
        .join(User, HasilJawabanSiswa.id_user == User.id_user)
        .filter(HasilJawabanSiswa.id_tob == user.id_tob)
        .order_by(desc(HasilJawabanSiswa.nilai))
        .limit(10)\
        .all())
    
    return [
        {"rank": i+1, "nama": r.username, "nilai": r.nilai} 
        for i, (r, username) in enumerate(results)
    ]