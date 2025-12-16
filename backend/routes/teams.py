from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models import Team, Player, Match, User
from schemas import TeamCreate, TeamUpdate, TeamResponse, TeamDetailResponse, PlayerResponse
from auth import get_current_user

router = APIRouter(prefix="/api/teams", tags=["Teams"])

MAX_PLAYERS_PER_TEAM = 10

@router.get("", response_model=List[TeamResponse])
async def get_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    teams = db.query(Team).all()
    result = []
    for team in teams:
        team_dict = TeamResponse(
            id=team.id,
            name=team.name,
            tag=team.tag,
            is_free_agents=team.is_free_agents,
            created_at=team.created_at,
            player_count=len(team.players)
        )
        result.append(team_dict)
    return result

@router.get("/{team_id}", response_model=TeamDetailResponse)
async def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Count matches where this team participated
    matches_as_team1 = db.query(Match).filter(
        Match.team1_id == team_id,
        Match.is_completed == True
    ).all()
    matches_as_team2 = db.query(Match).filter(
        Match.team2_id == team_id,
        Match.is_completed == True
    ).all()
    
    total_matches = len(matches_as_team1) + len(matches_as_team2)
    wins = 0
    losses = 0
    
    for match in matches_as_team1:
        if match.team1_score > match.team2_score:
            wins += 1
        else:
            losses += 1
    
    for match in matches_as_team2:
        if match.team2_score > match.team1_score:
            wins += 1
        else:
            losses += 1
    
    players = [PlayerResponse(
        id=p.id,
        nickname=p.nickname,
        team_id=p.team_id,
        total_kills=p.total_kills,
        total_deaths=p.total_deaths,
        total_flags=p.total_flags,
        matches_played=p.matches_played,
        created_at=p.created_at
    ) for p in team.players]
    
    return TeamDetailResponse(
        id=team.id,
        name=team.name,
        tag=team.tag,
        is_free_agents=team.is_free_agents,
        created_at=team.created_at,
        player_count=len(team.players),
        players=players,
        matches_played=total_matches,
        wins=wins,
        losses=losses
    )

@router.post("", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if team name or tag already exists
    existing_team = db.query(Team).filter(
        (Team.name == team_data.name) | (Team.tag == team_data.tag)
    ).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name or tag already exists"
        )
    
    new_team = Team(
        name=team_data.name,
        tag=team_data.tag,
        is_free_agents=team_data.is_free_agents
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    return TeamResponse(
        id=new_team.id,
        name=new_team.name,
        tag=new_team.tag,
        is_free_agents=new_team.is_free_agents,
        created_at=new_team.created_at,
        player_count=0
    )

@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if team_data.name:
        existing = db.query(Team).filter(Team.name == team_data.name, Team.id != team_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists"
            )
        team.name = team_data.name
    
    if team_data.tag:
        existing = db.query(Team).filter(Team.tag == team_data.tag, Team.id != team_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team tag already exists"
            )
        team.tag = team_data.tag
    
    db.commit()
    db.refresh(team)
    
    return TeamResponse(
        id=team.id,
        name=team.name,
        tag=team.tag,
        is_free_agents=team.is_free_agents,
        created_at=team.created_at,
        player_count=len(team.players)
    )

@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if team has any matches
    matches_count = db.query(Match).filter(
        (Match.team1_id == team_id) | (Match.team2_id == team_id)
    ).count()
    
    if matches_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete team with existing matches"
        )
    
    # Remove players from team
    db.query(Player).filter(Player.team_id == team_id).update({"team_id": None})
    
    db.delete(team)
    db.commit()
    return {"message": "Team deleted successfully"}

@router.post("/{team_id}/players/{player_id}")
async def add_player_to_team(
    team_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    # Check team capacity (unless FREE AGENTS)
    if not team.is_free_agents:
        current_players = db.query(Player).filter(Player.team_id == team_id).count()
        if current_players >= MAX_PLAYERS_PER_TEAM:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team already has maximum {MAX_PLAYERS_PER_TEAM} players"
            )
    
    player.team_id = team_id
    db.commit()
    return {"message": f"Player {player.nickname} added to team {team.name}"}

@router.delete("/{team_id}/players/{player_id}")
async def remove_player_from_team(
    team_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    player = db.query(Player).filter(Player.id == player_id, Player.team_id == team_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found in this team"
        )
    
    player.team_id = None
    db.commit()
    return {"message": f"Player {player.nickname} removed from team"}
