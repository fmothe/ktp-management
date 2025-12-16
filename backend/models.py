from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class MatchType(enum.Enum):
    DRAFT = "DRAFT"
    LEAGUE = "LEAGUE"
    SCRIM = "SCRIM"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    tag = Column(String(10), unique=True, nullable=False)
    is_free_agents = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    players = relationship("Player", back_populates="team")
    home_matches = relationship("Match", foreign_keys="Match.team1_id", back_populates="team1")
    away_matches = relationship("Match", foreign_keys="Match.team2_id", back_populates="team2")

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Overall stats (excluding SCRIM matches)
    total_kills = Column(Integer, default=0)
    total_deaths = Column(Integer, default=0)
    total_flags = Column(Integer, default=0)
    matches_played = Column(Integer, default=0)
    
    team = relationship("Team", back_populates="players")
    match_stats = relationship("PlayerMatchStats", back_populates="player")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    match_type = Column(SQLEnum(MatchType), nullable=False)
    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team1_score = Column(Integer, default=0)
    team2_score = Column(Integer, default=0)
    map_name = Column(String(50), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    played_date = Column(DateTime(timezone=True), nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    team1 = relationship("Team", foreign_keys=[team1_id], back_populates="home_matches")
    team2 = relationship("Team", foreign_keys=[team2_id], back_populates="away_matches")
    player_stats = relationship("PlayerMatchStats", back_populates="match", cascade="all, delete-orphan")

class PlayerMatchStats(Base):
    __tablename__ = "player_match_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    half = Column(Integer, nullable=False)  # 1 or 2
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    flags = Column(Integer, default=0)
    is_ringer = Column(Boolean, default=False)
    
    match = relationship("Match", back_populates="player_stats")
    player = relationship("Player", back_populates="match_stats")
