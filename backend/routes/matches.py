from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List
from datetime import datetime

from database import get_db
from models import Match, Team, Player, PlayerMatchStats, User, MatchType
from schemas import (
    MatchCreate, MatchUpdate, MatchResponse, MatchDetailResponse,
    MatchLoadRequest, PlayerMatchStatsCreate, PlayerMatchStatsResponse
)
from auth import get_current_user

router = APIRouter(prefix="/api/matches", tags=["Matches"])

def get_match_response(match: Match, db: Session) -> MatchResponse:
    team1 = db.query(Team).filter(Team.id == match.team1_id).first()
    team2 = db.query(Team).filter(Team.id == match.team2_id).first()
    
    return MatchResponse(
        id=match.id,
        match_type=match.match_type.value,
        team1_id=match.team1_id,
        team2_id=match.team2_id,
        team1_score=match.team1_score,
        team2_score=match.team2_score,
        map_name=match.map_name,
        scheduled_date=match.scheduled_date,
        played_date=match.played_date,
        is_completed=match.is_completed,
        created_at=match.created_at,
        team1_name=team1.name if team1 else None,
        team2_name=team2.name if team2 else None,
        team1_tag=team1.tag if team1 else None,
        team2_tag=team2.tag if team2 else None
    )

@router.get("", response_model=List[MatchResponse])
async def get_matches(
    match_type: str = None,
    is_completed: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Match)
    
    if match_type:
        query = query.filter(Match.match_type == MatchType(match_type))
    
    if is_completed is not None:
        query = query.filter(Match.is_completed == is_completed)
    
    matches = query.order_by(Match.created_at.desc()).all()
    return [get_match_response(m, db) for m in matches]

@router.get("/upcoming", response_model=List[MatchResponse])
async def get_upcoming_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    matches = db.query(Match).filter(
        Match.is_completed == False,
        Match.scheduled_date != None,
        Match.scheduled_date >= datetime.utcnow()
    ).order_by(Match.scheduled_date.asc()).limit(10).all()
    
    return [get_match_response(m, db) for m in matches]

@router.get("/recent", response_model=List[MatchResponse])
async def get_recent_matches(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    matches = db.query(Match).filter(
        Match.is_completed == True
    ).order_by(Match.played_date.desc()).limit(limit).all()
    
    return [get_match_response(m, db) for m in matches]

@router.get("/{match_id}", response_model=MatchDetailResponse)
async def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    team1 = db.query(Team).filter(Team.id == match.team1_id).first()
    team2 = db.query(Team).filter(Team.id == match.team2_id).first()
    
    # Get player stats
    stats = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id
    ).all()
    
    player_stats = []
    for stat in stats:
        player = db.query(Player).filter(Player.id == stat.player_id).first()
        player_stats.append(PlayerMatchStatsResponse(
            id=stat.id,
            match_id=stat.match_id,
            player_id=stat.player_id,
            team_id=stat.team_id,
            half=stat.half,
            kills=stat.kills,
            deaths=stat.deaths,
            flags=stat.flags,
            is_ringer=stat.is_ringer,
            player_nickname=player.nickname if player else "Unknown"
        ))
    
    return MatchDetailResponse(
        id=match.id,
        match_type=match.match_type.value,
        team1_id=match.team1_id,
        team2_id=match.team2_id,
        team1_score=match.team1_score,
        team2_score=match.team2_score,
        map_name=match.map_name,
        scheduled_date=match.scheduled_date,
        played_date=match.played_date,
        is_completed=match.is_completed,
        created_at=match.created_at,
        team1_name=team1.name if team1 else None,
        team2_name=team2.name if team2 else None,
        team1_tag=team1.tag if team1 else None,
        team2_tag=team2.tag if team2 else None,
        player_stats=player_stats
    )

@router.post("", response_model=MatchResponse)
async def create_match(
    match_data: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate teams exist
    team1 = db.query(Team).filter(Team.id == match_data.team1_id).first()
    team2 = db.query(Team).filter(Team.id == match_data.team2_id).first()
    
    if not team1 or not team2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both teams not found"
        )
    
    if match_data.team1_id == match_data.team2_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team cannot play against itself"
        )
    
    new_match = Match(
        match_type=MatchType(match_data.match_type),
        team1_id=match_data.team1_id,
        team2_id=match_data.team2_id,
        map_name=match_data.map_name,
        scheduled_date=match_data.scheduled_date,
        is_completed=False
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    
    return get_match_response(new_match, db)

@router.post("/load", response_model=MatchDetailResponse)
async def load_match(
    match_data: MatchLoadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Load a complete match with all player stats.
    For SCRIM matches, stats won't count towards player totals.
    """
    # Validate teams exist
    team1 = db.query(Team).filter(Team.id == match_data.team1_id).first()
    team2 = db.query(Team).filter(Team.id == match_data.team2_id).first()
    
    if not team1 or not team2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both teams not found"
        )
    
    if match_data.team1_id == match_data.team2_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team cannot play against itself"
        )
    
    # Create the match
    new_match = Match(
        match_type=MatchType(match_data.match_type),
        team1_id=match_data.team1_id,
        team2_id=match_data.team2_id,
        team1_score=match_data.team1_score,
        team2_score=match_data.team2_score,
        map_name=match_data.map_name,
        played_date=match_data.played_date or datetime.utcnow(),
        is_completed=True
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    
    is_scrim = match_data.match_type == "SCRIM"
    
    # Track unique players to update their match count only once
    players_in_match = set()
    
    # Add player stats
    for stat_data in match_data.player_stats:
        # Validate player exists
        player = db.query(Player).filter(Player.id == stat_data.player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with id {stat_data.player_id} not found"
            )
        
        stat = PlayerMatchStats(
            match_id=new_match.id,
            player_id=stat_data.player_id,
            team_id=stat_data.team_id,
            half=stat_data.half,
            kills=stat_data.kills,
            deaths=stat_data.deaths,
            flags=stat_data.flags,
            is_ringer=stat_data.is_ringer
        )
        db.add(stat)
        
        # Update player totals (only for non-SCRIM matches and non-ringers)
        if not is_scrim and not stat_data.is_ringer:
            player.total_kills += stat_data.kills
            player.total_deaths += stat_data.deaths
            player.total_flags += stat_data.flags
            players_in_match.add(player.id)
    
    # Update match count for each player (only once per player)
    if not is_scrim:
        for player_id in players_in_match:
            player = db.query(Player).filter(Player.id == player_id).first()
            if player:
                player.matches_played += 1
    
    db.commit()
    
    # Return full match details
    return await get_match(new_match.id, db, current_user)

@router.put("/{match_id}", response_model=MatchResponse)
async def update_match(
    match_id: int,
    match_data: MatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    if match_data.match_type:
        match.match_type = MatchType(match_data.match_type)
    
    if match_data.team1_id:
        team = db.query(Team).filter(Team.id == match_data.team1_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team 1 not found")
        match.team1_id = match_data.team1_id
    
    if match_data.team2_id:
        team = db.query(Team).filter(Team.id == match_data.team2_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team 2 not found")
        match.team2_id = match_data.team2_id
    
    if match_data.team1_score is not None:
        match.team1_score = match_data.team1_score
    
    if match_data.team2_score is not None:
        match.team2_score = match_data.team2_score
    
    if match_data.map_name:
        match.map_name = match_data.map_name
    
    if match_data.scheduled_date:
        match.scheduled_date = match_data.scheduled_date
    
    if match_data.is_completed is not None:
        match.is_completed = match_data.is_completed
        if match_data.is_completed and not match.played_date:
            match.played_date = datetime.utcnow()
    
    db.commit()
    db.refresh(match)
    
    return get_match_response(match, db)

@router.delete("/{match_id}")
async def delete_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    is_scrim = match.match_type == MatchType.SCRIM
    
    # If match was completed, we need to subtract stats from players
    if match.is_completed and not is_scrim:
        stats = db.query(PlayerMatchStats).filter(
            PlayerMatchStats.match_id == match_id
        ).all()
        
        players_updated = set()
        for stat in stats:
            if not stat.is_ringer:
                player = db.query(Player).filter(Player.id == stat.player_id).first()
                if player:
                    player.total_kills -= stat.kills
                    player.total_deaths -= stat.deaths
                    player.total_flags -= stat.flags
                    players_updated.add(player.id)
        
        # Decrease match count
        for player_id in players_updated:
            player = db.query(Player).filter(Player.id == player_id).first()
            if player and player.matches_played > 0:
                player.matches_played -= 1
    
    # Delete match stats
    db.query(PlayerMatchStats).filter(PlayerMatchStats.match_id == match_id).delete()
    
    # Delete match
    db.delete(match)
    db.commit()
    
    return {"message": "Match deleted successfully"}

@router.post("/{match_id}/stats", response_model=PlayerMatchStatsResponse)
async def add_player_stat(
    match_id: int,
    stat_data: PlayerMatchStatsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a single player stat to an existing match"""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    player = db.query(Player).filter(Player.id == stat_data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if stat already exists for this player/half combo
    existing = db.query(PlayerMatchStats).filter(
        PlayerMatchStats.match_id == match_id,
        PlayerMatchStats.player_id == stat_data.player_id,
        PlayerMatchStats.half == stat_data.half
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Stats already exist for this player in half {stat_data.half}"
        )
    
    stat = PlayerMatchStats(
        match_id=match_id,
        player_id=stat_data.player_id,
        team_id=stat_data.team_id,
        half=stat_data.half,
        kills=stat_data.kills,
        deaths=stat_data.deaths,
        flags=stat_data.flags,
        is_ringer=stat_data.is_ringer
    )
    db.add(stat)
    
    # Update player totals if not scrim and not ringer
    is_scrim = match.match_type == MatchType.SCRIM
    if not is_scrim and not stat_data.is_ringer:
        player.total_kills += stat_data.kills
        player.total_deaths += stat_data.deaths
        player.total_flags += stat_data.flags
    
    db.commit()
    db.refresh(stat)
    
    return PlayerMatchStatsResponse(
        id=stat.id,
        match_id=stat.match_id,
        player_id=stat.player_id,
        team_id=stat.team_id,
        half=stat.half,
        kills=stat.kills,
        deaths=stat.deaths,
        flags=stat.flags,
        is_ringer=stat.is_ringer,
        player_nickname=player.nickname
    )
