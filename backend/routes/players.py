from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import Player, Team, Match, PlayerMatchStats, User, MatchType
from schemas import PlayerCreate, PlayerUpdate, PlayerResponse, PlayerDetailResponse, PlayerMatchStatsResponse
from auth import get_current_user

router = APIRouter(prefix="/api/players", tags=["Players"])

@router.get("", response_model=List[PlayerResponse])
async def get_players(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    players = db.query(Player).all()
    return players

@router.get("/{player_id}", response_model=dict)
async def get_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    team_name = None
    if player.team_id:
        team = db.query(Team).filter(Team.id == player.team_id).first()
        team_name = team.name if team else None
    
    kd_ratio = 0.0
    if player.total_deaths > 0:
        kd_ratio = round(player.total_kills / player.total_deaths, 2)
    elif player.total_kills > 0:
        kd_ratio = float(player.total_kills)
    
    # Get match history
    match_stats = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.player_id == player_id
    ).all()
    
    # Group stats by match
    match_ids = list(set([stat.match_id for stat in match_stats]))
    matches_data = []
    
    for match_id in match_ids:
        match = db.query(Match).filter(Match.id == match_id).first()
        if match:
            team1 = db.query(Team).filter(Team.id == match.team1_id).first()
            team2 = db.query(Team).filter(Team.id == match.team2_id).first()
            
            player_match_stats = [s for s in match_stats if s.match_id == match_id]
            total_kills = sum(s.kills for s in player_match_stats)
            total_deaths = sum(s.deaths for s in player_match_stats)
            total_flags = sum(s.flags for s in player_match_stats)
            
            matches_data.append({
                "match_id": match.id,
                "match_type": match.match_type.value,
                "team1_name": team1.name if team1 else "Unknown",
                "team2_name": team2.name if team2 else "Unknown",
                "team1_tag": team1.tag if team1 else "???",
                "team2_tag": team2.tag if team2 else "???",
                "team1_score": match.team1_score,
                "team2_score": match.team2_score,
                "map_name": match.map_name,
                "played_date": match.played_date,
                "player_kills": total_kills,
                "player_deaths": total_deaths,
                "player_flags": total_flags,
                "is_completed": match.is_completed
            })
    
    return {
        "id": player.id,
        "nickname": player.nickname,
        "team_id": player.team_id,
        "team_name": team_name,
        "total_kills": player.total_kills,
        "total_deaths": player.total_deaths,
        "total_flags": player.total_flags,
        "matches_played": player.matches_played,
        "kd_ratio": kd_ratio,
        "created_at": player.created_at,
        "match_history": matches_data
    }

@router.post("", response_model=PlayerResponse)
async def create_player(
    player_data: PlayerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if nickname already exists
    existing_player = db.query(Player).filter(Player.nickname == player_data.nickname).first()
    if existing_player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Player nickname already exists"
        )
    
    # Validate team if provided
    if player_data.team_id:
        team = db.query(Team).filter(Team.id == player_data.team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
        
        # Check team capacity
        if not team.is_free_agents:
            current_players = db.query(Player).filter(Player.team_id == player_data.team_id).count()
            if current_players >= 10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Team already has maximum 10 players"
                )
    
    new_player = Player(
        nickname=player_data.nickname,
        team_id=player_data.team_id
    )
    db.add(new_player)
    db.commit()
    db.refresh(new_player)
    return new_player

@router.put("/{player_id}", response_model=PlayerResponse)
async def update_player(
    player_id: int,
    player_data: PlayerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    if player_data.nickname:
        existing = db.query(Player).filter(
            Player.nickname == player_data.nickname,
            Player.id != player_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nickname already exists"
            )
        player.nickname = player_data.nickname
    
    if player_data.team_id is not None:
        if player_data.team_id == 0:
            player.team_id = None
        else:
            team = db.query(Team).filter(Team.id == player_data.team_id).first()
            if not team:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Team not found"
                )
            
            if not team.is_free_agents:
                current_players = db.query(Player).filter(
                    Player.team_id == player_data.team_id,
                    Player.id != player_id
                ).count()
                if current_players >= 10:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Team already has maximum 10 players"
                    )
            
            player.team_id = player_data.team_id
    
    db.commit()
    db.refresh(player)
    return player

@router.delete("/{player_id}")
async def delete_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    # Check if player has match stats
    stats_count = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.player_id == player_id
    ).count()
    
    if stats_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete player with match history"
        )
    
    db.delete(player)
    db.commit()
    return {"message": "Player deleted successfully"}
