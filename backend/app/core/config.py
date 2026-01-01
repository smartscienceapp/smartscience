from pydantic_settings import BaseSettings 
from pydantic import PostgresDsn 

class Setting(BaseSettings):
    PROJECT_NAME: str = "SmartScience"
    SECRET_KEY: str = "smartsciencejuara"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 
    DATABASE_URL: str = "postgresql://postgres.imheqybfsrapopumewya:5DZZOP42x3PJSZYB@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

    class Config:
        env_file = ".env"
        # Tambahkan ini agar Pydantic tetap membaca env file meski ada error encoding
        env_file_encoding = 'utf-8' 
        # Opsional: Case sensitive bisa mempengaruhi pembacaan .env
        case_sensitive = True

settings = Setting()