# force_seed.py
import sys
import os

# 1. Pastikan folder aplikasi terbaca
sys.path.append(os.getcwd())

from app.database.session import SessionLocal
from models.models import Role, Kelas, User
from sqlalchemy import text
from pwdlib import PasswordHash

pwd_context = PasswordHash.recommended()
def get_password_hash(password):
    return pwd_context.hash(password)

def force_seed():
    print("🚀 Memulai Forced Seeding...")
    db = SessionLocal()
    try:
        # --- SEED ROLE ---
        if not db.query(Role).filter(Role.id_role == 1).first():
            print("   + Membuat Role...")
            roles = [
                Role(id_role=1, nama_role="admin"),
                Role(id_role=2, nama_role="guru"),
                Role(id_role=3, nama_role="siswa"),
            ]
            db.add_all(roles)
            db.commit()
            # Fix Sequence Role
            db.execute(text("SELECT setval('t_role_id_role_seq', (SELECT MAX(id_role) FROM t_role));"))
        else:
            print("   - Role sudah ada, skip.")

        # --- SEED KELAS ---
        if not db.query(Kelas).filter(Kelas.id_kelas == 1).first():
            print("   + Membuat Kelas Admin...")
            k = [Kelas(id_kelas=1, nama_kelas="admin"), Kelas(id_kelas=2, nama_kelas="guru"), Kelas(id_kelas=3, nama_kelas="10 SMA IPA")]
            db.add_all(k)
            db.commit()
            # Fix Sequence Kelas
            db.execute(text("SELECT setval('t_kelas_id_kelas_seq', (SELECT MAX(id_kelas) FROM t_kelas));"))
        else:
            print("   - Kelas Admin sudah ada, skip.")

        # --- SEED USER ---
        if not db.query(User).filter(User.username == "admin").first():
            print("   + Membuat User Admin...")
            u = User(
                username="admin",
                hashed_password=get_password_hash("admin"), 
                id_role=1,
                id_kelas=1,
                is_active=True,
                created_by="force_seed"
            )
            db.add(u)
            db.commit()
            # Fix Sequence User
            db.execute(text("SELECT setval('t_user_id_user_seq', (SELECT MAX(id_user) FROM t_user));"))
            print("   ✅ User Admin BERHASIL dibuat!")
        else:
            print("   - User Admin sudah ada.")

    except Exception as e:
        print(f"❌ Error Terjadi: {e}")
        db.rollback()
    finally:
        db.close()
        print("🏁 Selesai.")

if __name__ == "__main__":
    force_seed()