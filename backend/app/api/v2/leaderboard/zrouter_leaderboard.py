
from fastapi import APIRouter
from app.api.v2.leaderboard import (  
    leaderboard
)

leaderboard_router = APIRouter()

leaderboard_router.include_router(leaderboard.router)
