from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MatchTypeEnum(str, Enum):
    DRAFT = "DRAFT"
    LEAGUE = "LEAGUE"
    SCRIM = "SCRIM"

# User schemas
class UserBase(BaseModel):
    username: str

class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Team schemas
class TeamBase(BaseModel):
    name: str
    tag: str

class TeamCreate(TeamBase):
    is_free_agents: bool = False

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    tag: Optional[str] = None

class TeamResponse(TeamBase):
    id: int
    is_free_agents: bool
    created_at: datetime
    player_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class TeamDetailResponse(TeamResponse):
    players: List["PlayerResponse"] = []
    matches_played: int = 0
    wins: int = 0
    losses: int = 0

# Player schemas
class PlayerBase(BaseModel):
    nickname: str

class PlayerCreate(PlayerBase):
    team_id: Optional[int] = None

class PlayerUpdate(BaseModel):
    nickname: Optional[str] = None
    team_id: Optional[int] = None

class PlayerResponse(PlayerBase):
    id: int
    team_id: Optional[int]
    total_kills: int
    total_deaths: int
    total_flags: int
    matches_played: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PlayerDetailResponse(PlayerResponse):
    team_name: Optional[str] = None
    kd_ratio: float = 0.0

class PlayerStatsLeaderboard(BaseModel):
    id: int
    nickname: str
    team_name: Optional[str]
    total_kills: int
    total_deaths: int
    total_flags: int
    matches_played: int
    kd_ratio: float
    
    class Config:
        from_attributes = True

# Match schemas
class PlayerMatchStatsCreate(BaseModel):
    player_id: int
    team_id: int
    half: int = Field(ge=1, le=2)
    kills: int = Field(ge=0)
    deaths: int = Field(ge=0)
    flags: int = Field(ge=0)
    is_ringer: bool = False

class PlayerMatchStatsResponse(BaseModel):
    id: int
    match_id: int
    player_id: int
    team_id: int
    half: int
    kills: int
    deaths: int
    flags: int
    is_ringer: bool
    player_nickname: Optional[str] = None
    
    class Config:
        from_attributes = True

class MatchBase(BaseModel):
    match_type: MatchTypeEnum
    team1_id: int
    team2_id: int
    map_name: Optional[str] = None

class MatchCreate(MatchBase):
    scheduled_date: Optional[datetime] = None

class MatchUpdate(BaseModel):
    match_type: Optional[MatchTypeEnum] = None
    team1_id: Optional[int] = None
    team2_id: Optional[int] = None
    team1_score: Optional[int] = None
    team2_score: Optional[int] = None
    map_name: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    is_completed: Optional[bool] = None

class MatchResponse(MatchBase):
    id: int
    team1_score: int
    team2_score: int
    scheduled_date: Optional[datetime]
    played_date: Optional[datetime]
    is_completed: bool
    created_at: datetime
    team1_name: Optional[str] = None
    team2_name: Optional[str] = None
    team1_tag: Optional[str] = None
    team2_tag: Optional[str] = None
    
    class Config:
        from_attributes = True

class MatchDetailResponse(MatchResponse):
    player_stats: List[PlayerMatchStatsResponse] = []

class MatchLoadRequest(BaseModel):
    match_type: MatchTypeEnum
    team1_id: int
    team2_id: int
    map_name: str
    team1_score: int
    team2_score: int
    player_stats: List[PlayerMatchStatsCreate]
    played_date: Optional[datetime] = None

# Dashboard schemas
class DashboardStats(BaseModel):
    total_matches: int
    total_teams: int
    total_players: int
    most_played_map: Optional[str]
    most_played_map_count: int
    top_kd_player: Optional[PlayerStatsLeaderboard]
    top_flags_player: Optional[PlayerStatsLeaderboard]
    recent_matches: List[MatchResponse]
    upcoming_matches: List[MatchResponse]

# Update forward references
TeamDetailResponse.model_rebuild()
