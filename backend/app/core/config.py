from pydantic_settings import BaseSettings 
from pydantic import PostgresDsn 

class Setting(BaseSettings):
    PROJECT_NAME: str = "SmartScience"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 
    DATABASE_URL: str

    class Config:
        env_file = ".env" 
        env_file_encoding = 'utf-8'  
        case_sensitive = True

settings = Setting()