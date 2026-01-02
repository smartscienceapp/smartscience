from pydantic import BaseModel, EmailStr
from typing import List, Optional

class GetLeaderboard(BaseModel):
    id_tob: int