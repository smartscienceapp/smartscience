from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserFilter(BaseModel):
    id_role: int
    id_kelas: Optional[int] = None
    page: int = 1
    limit: int = 10
    search: Optional[str] = None  # Untuk pencarian nama

# Schema untuk Input (Client -> Server)
class UserCreate(BaseModel):
    username: str
    password: str
    id_role: int 
    id_kelas: int
    created_by: str
    
class UserFindByRole(BaseModel):
    id_role: int 
    
class Token(BaseModel):
    access_token: str
    token_type: str  
    
class KelasCreate(BaseModel):
    nama_kelas: str
    created_by: str
    
class DeleteKelas(BaseModel):
    id_kelas: int
    
class MataPelajaranCreate(BaseModel):
    nama_mapel: str
    id_kelas: int | None = None
    created_by: str | None = "system"  
    
class MapelFind(BaseModel):
    id_kelas: int 
    
class DeleteMapel(BaseModel):
    id_mapel: int
    
class TautkanMapel(BaseModel):
    id_mapel: int
    id_kelas: int
    created_by: str
    
class BabCreate(BaseModel) :
    id_mapel: int
    id_kelas: int
    nama_bab: str
    created_by: str 
    
class BabFind(BaseModel):
    id_mapel: int 
    id_kelas : int
    
class TautkanBab(BaseModel):
    id_mapel: int
    id_kelas: int
    id_bab: int
    created_by: str
    
class SoalCreate(BaseModel) : 
    id_bab: int
    isi_soal: str
    image_soal:str
    option : str
    created_by: str
    
class SoalFind(BaseModel):
    id_bab: int 
    
class SoalUpdate(BaseModel) :
    id_soal: int
    id_bab: int |None = None 
    isi_soal: str | None = None
    image_soal:str | None = None
    option : str | None = None 
    created_by: str | None = None   
    
class DeleteSoal(BaseModel):
    id_soal: int
    
    
class TOBCreate(BaseModel):
    nama_tob: str
    id_kelas: int
    id_mapel: int 
    created_by: str | None = "system"  
    
class MapelKelasCreate(BaseModel): 
    id_kelas: int | None = None
    created_by: str | None = "system"   
    id_mapel: int | None = None
    
class TOBFind(BaseModel):
    id_mapel: int 
    id_kelas : int
    
class SoalFindByTOB(BaseModel):
    id_tob: int
    
class SoalFindByTOBBab(BaseModel):
    id_bab:int
    
class GetDetailSoal(BaseModel):
    id_soal: int
    
class GetDetailSoalFull(BaseModel):
    id_tob: int

class DeleteSoalTOB(BaseModel):
    id_tob: int
    id_soal: int
    
class AddSoalTOB(BaseModel):
    id_tob: int
    id_soal: int
    created_by: str | None = "system"
    
class StatusPengerjaan(BaseModel) :
    id_user: int
    id_tob: int
    
class JawabanItem(BaseModel):
    id_soal: int
    jawaban: str
    is_correct: bool

class SubmitPengerjaanRequest(BaseModel):
    id_user: str
    id_tob: int
    jawaban_siswa: str
    created_by: str
    
class GetPengerjaanSiswa(BaseModel) :
    id_user : int   
    id_tob : int
    
class DeleteUser(BaseModel):
    id_user: int
    
class DeleteBab(BaseModel) : 
    id_bab: int