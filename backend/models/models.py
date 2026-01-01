from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Role(Base):
    __tablename__ = "t_role"
    id_role = Column(Integer, primary_key=True, index=True)
    nama_role = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
    
    role_user = relationship("User", back_populates="user_role", cascade="all, delete-orphan", passive_deletes=True)

class Kelas(Base):
    __tablename__ = "t_kelas"
    id_kelas = Column(Integer, primary_key=True, index=True)
    nama_kelas = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
    
    kelas_user = relationship("User", back_populates="user_kelas", cascade="all, delete-orphan", passive_deletes=True)
    kelas_tob = relationship("TOB", back_populates="tob_kelas", cascade="all, delete-orphan", passive_deletes=True)
    kelas_mapel_kelas = relationship("MapelKelas", back_populates="mapel_kelas_kelas", cascade="all, delete-orphan", passive_deletes=True)
    kelas_mapel_kelas_bab = relationship("MapelKelasBab", back_populates="mapel_kelas_bab_kelas", cascade="all, delete-orphan", passive_deletes=True)

class MataPelajaran(Base):
    __tablename__ = "t_mata_pelajaran"
    id_mapel = Column(Integer, primary_key=True, index=True)
    nama_mapel = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
    
    mapel_tob = relationship("TOB", back_populates="tob_mapel", cascade="all, delete-orphan", passive_deletes=True)
    mapel_mapel_kelas = relationship("MapelKelas", back_populates="mapel_kelas_mapel", cascade="all, delete-orphan", passive_deletes=True)
    mapel_mapel_kelas_bab = relationship("MapelKelasBab", back_populates="mapel_kelas_bab_mapel", cascade="all, delete-orphan", passive_deletes=True)

class User(Base):
    __tablename__ = "t_user"
    id_user = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String) 
    id_role = Column(Integer, ForeignKey("t_role.id_role", ondelete="CASCADE"), default=3)
    is_active = Column(Boolean, default=True) 
    id_kelas = Column(Integer, ForeignKey("t_kelas.id_kelas", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
        
    user_hasil_jawaban_siswa = relationship("HasilJawabanSiswa", back_populates="hasil_jawaban_siswa_user", cascade="all, delete-orphan", passive_deletes=True)
    user_kelas = relationship("Kelas", back_populates="kelas_user")
    user_role = relationship("Role", back_populates="role_user")

class TOB(Base):
    __tablename__ = "t_tob"
    id_tob = Column(Integer, primary_key=True, index=True)
    nama_tob = Column(String, index=True) 
    id_kelas = Column(Integer, ForeignKey("t_kelas.id_kelas", ondelete="CASCADE"))
    id_mapel = Column(Integer, ForeignKey("t_mata_pelajaran.id_mapel", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")

    tob_soal_tob = relationship("SoalTOB", back_populates="soal_tob_tob", cascade="all, delete-orphan", passive_deletes=True)
    tob_hasil_jawaban_siswa = relationship("HasilJawabanSiswa", back_populates="hasil_jawaban_siswa_tob", cascade="all, delete-orphan", passive_deletes=True)   
    tob_kelas = relationship("Kelas", back_populates="kelas_tob")
    tob_mapel = relationship("MataPelajaran", back_populates="mapel_tob")

class MapelKelas(Base):
    __tablename__ = "t_mapel_kelas"
    id_mapel_kelas = Column(Integer, primary_key=True, index=True) 
    id_kelas = Column(Integer, ForeignKey("t_kelas.id_kelas", ondelete="CASCADE"))
    id_mapel = Column(Integer, ForeignKey("t_mata_pelajaran.id_mapel", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
    
    mapel_kelas_kelas = relationship("Kelas", back_populates="kelas_mapel_kelas")
    mapel_kelas_mapel = relationship("MataPelajaran", back_populates="mapel_mapel_kelas") 

class Bab(Base) :
    __tablename__ = "t_bab"
    id_bab = Column(Integer, primary_key=True, index=True)  
    nama_bab = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
    
    bab_mapel_kelas_bab = relationship("MapelKelasBab", back_populates="mapel_kelas_bab_bab", cascade="all, delete-orphan", passive_deletes=True)
    bab_soal = relationship("Soal", back_populates="soal_bab", cascade="all, delete-orphan", passive_deletes=True)

class MapelKelasBab(Base):
    __tablename__ = "t_mapel_kelas_bab"
    id_mapel_kelas_bab = Column(Integer, primary_key=True, index=True)
    id_kelas = Column(Integer, ForeignKey("t_kelas.id_kelas", ondelete="CASCADE"))
    id_mapel = Column(Integer, ForeignKey("t_mata_pelajaran.id_mapel", ondelete="CASCADE"))
    id_bab = Column(Integer, ForeignKey("t_bab.id_bab", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system") 

    mapel_kelas_bab_kelas = relationship("Kelas", back_populates="kelas_mapel_kelas_bab")
    mapel_kelas_bab_mapel = relationship("MataPelajaran", back_populates="mapel_mapel_kelas_bab")
    mapel_kelas_bab_bab = relationship("Bab", back_populates="bab_mapel_kelas_bab")

class Soal(Base) :
    __tablename__ = "t_soal"
    id_soal = Column(Integer, primary_key=True, index=True)  
    id_bab = Column(Integer, ForeignKey("t_bab.id_bab", ondelete="CASCADE"))
    isi_soal = Column(String)
    image_soal = Column(String)
    option = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system") 
    
    soal_soal_tob = relationship("SoalTOB", back_populates="soal_tob_soal", cascade="all, delete-orphan", passive_deletes=True)
    soal_bab = relationship("Bab", back_populates="bab_soal") 
    
class SoalTOB(Base):
    __tablename__ = "t_soal_tob"
    id_soal_tob = Column(Integer, primary_key=True, index=True) 
    id_soal = Column(Integer, ForeignKey("t_soal.id_soal", ondelete="CASCADE"))
    id_tob = Column(Integer, ForeignKey("t_tob.id_tob", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
    
    soal_tob_soal = relationship("Soal", back_populates="soal_soal_tob")
    soal_tob_tob = relationship("TOB", back_populates="tob_soal_tob")
    
class HasilJawabanSiswa(Base):
    __tablename__ = "t_hasil_jawaban_siswa"
    id_hasil_jawaban = Column(Integer, primary_key=True, index=True) 
    id_user = Column(Integer, ForeignKey("t_user.id_user", ondelete="CASCADE"))
    id_tob = Column(Integer, ForeignKey("t_tob.id_tob", ondelete="CASCADE")) 
    jawaban_siswa = Column(String)
    nilai = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, default="system")
    
    hasil_jawaban_siswa_user = relationship("User", back_populates="user_hasil_jawaban_siswa")
    hasil_jawaban_siswa_tob = relationship("TOB", back_populates="tob_hasil_jawaban_siswa")