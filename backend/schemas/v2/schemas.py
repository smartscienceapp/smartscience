from pydantic import BaseModel, EmailStr
from typing import List, Optional

class GetLeaderboard(BaseModel):
    id_tob: int
    
class GetDaftarNilai(BaseModel):
    id_tob: int
    page: int = 1
    limit: int = 10