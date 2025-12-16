from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List

from database import get_db
from models import Player, Team, Match, PlayerMatchStats, User, MatchType
from schemas import PlayerStatsLeaderboard, DashboardStats, MatchResponse
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("/leaderboard", response_model=List[PlayerStatsLeaderboard])
async def get_leaderboard(
    sort_by: str = "kd_ratio",
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get player leaderboard sorted by various stats.
    sort_by options: kd_ratio, kills, deaths, flags, matches
    """
    players = db.query(Player).filter(Player.matches_played > 0).all()
    
    leaderboard = []
    for player in players:
        team_name = None
        if player.team_id:
            team = db.query(Team).filter(Team.id == player.team_id).first()
            team_name = team.name if team else None
        
        kd_ratio = 0.0
        if player.total_deaths > 0:
            kd_ratio = round(player.total_kills / player.total_deaths, 2)
        elif player.total_kills > 0:
            kd_ratio = float(player.total_kills)
        
        leaderboard.append(PlayerStatsLeaderboard(
            id=player.id,
            nickname=player.nickname,
            team_name=team_name,
            total_kills=player.total_kills,
            total_deaths=player.total_deaths,
            total_flags=player.total_flags,
            matches_played=player.matches_played,
            kd_ratio=kd_ratio
        ))
    
    # Sort based on requested field
    if sort_by == "kills":
        leaderboard.sort(key=lambda x: x.total_kills, reverse=True)
    elif sort_by == "deaths":
        leaderboard.sort(key=lambda x: x.total_deaths, reverse=True)
    elif sort_by == "flags":
        leaderboard.sort(key=lambda x: x.total_flags, reverse=True)
    elif sort_by == "matches":
        leaderboard.sort(key=lambda x: x.matches_played, reverse=True)
    else:  # Default to kd_ratio
        leaderboard.sort(key=lambda x: x.kd_ratio, reverse=True)
    
    return leaderboard[:limit]

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics"""
    
    # Total counts
    total_matches = db.query(Match).filter(Match.is_completed == True).count()
    total_teams = db.query(Team).count()
    total_players = db.query(Player).count()
    
    # Most played map
    map_counts = db.query(
        Match.map_name,
        func.count(Match.id).label('count')
    ).filter(
        Match.is_completed == True,
        Match.map_name != None
    ).group_by(Match.map_name).order_by(desc('count')).first()
    
    most_played_map = map_counts[0] if map_counts else None
    most_played_map_count = map_counts[1] if map_counts else 0
    
    # Top K/D player
    players_with_stats = db.query(Player).filter(Player.matches_played > 0).all()
    
    top_kd_player = None
    top_flags_player = None
    
    if players_with_stats:
        # Calculate K/D for all players
        player_stats = []
        for player in players_with_stats:
            team_name = None
            if player.team_id:
                team = db.query(Team).filter(Team.id == player.team_id).first()
                team_name = team.name if team else None
            
            kd_ratio = 0.0
            if player.total_deaths > 0:
                kd_ratio = round(player.total_kills / player.total_deaths, 2)
            elif player.total_kills > 0:
                kd_ratio = float(player.total_kills)
            
            player_stats.append(PlayerStatsLeaderboard(
                id=player.id,
                nickname=player.nickname,
                team_name=team_name,
                total_kills=player.total_kills,
                total_deaths=player.total_deaths,
                total_flags=player.total_flags,
                matches_played=player.matches_played,
                kd_ratio=kd_ratio
            ))
        
        if player_stats:
            # Top K/D
            player_stats_sorted_kd = sorted(player_stats, key=lambda x: x.kd_ratio, reverse=True)
            top_kd_player = player_stats_sorted_kd[0] if player_stats_sorted_kd else None
            
            # Top Flags
            player_stats_sorted_flags = sorted(player_stats, key=lambda x: x.total_flags, reverse=True)
            top_flags_player = player_stats_sorted_flags[0] if player_stats_sorted_flags else None
    
    # Recent matches
    recent_matches_query = db.query(Match).filter(
        Match.is_completed == True
    ).order_by(Match.played_date.desc()).limit(5).all()
    
    recent_matches = []
    for match in recent_matches_query:
        team1 = db.query(Team).filter(Team.id == match.team1_id).first()
        team2 = db.query(Team).filter(Team.id == match.team2_id).first()
        recent_matches.append(MatchResponse(
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
        ))
    
    # Upcoming matches
    upcoming_matches_query = db.query(Match).filter(
        Match.is_completed == False,
        Match.scheduled_date != None,
        Match.scheduled_date >= datetime.utcnow()
    ).order_by(Match.scheduled_date.asc()).limit(5).all()
    
    upcoming_matches = []
    for match in upcoming_matches_query:
        team1 = db.query(Team).filter(Team.id == match.team1_id).first()
        team2 = db.query(Team).filter(Team.id == match.team2_id).first()
        upcoming_matches.append(MatchResponse(
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
        ))
    
    return DashboardStats(
        total_matches=total_matches,
        total_teams=total_teams,
        total_players=total_players,
        most_played_map=most_played_map,
        most_played_map_count=most_played_map_count,
        top_kd_player=top_kd_player,
        top_flags_player=top_flags_player,
        recent_matches=recent_matches,
        upcoming_matches=upcoming_matches
    )

@router.get("/maps")
async def get_map_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for each map"""
    map_stats = db.query(
        Match.map_name,
        func.count(Match.id).label('times_played')
    ).filter(
        Match.is_completed == True,
        Match.map_name != None
    ).group_by(Match.map_name).order_by(desc('times_played')).all()
    
    return [{"map_name": m[0], "times_played": m[1]} for m in map_stats]

@router.get("/team/{team_id}")
async def get_team_stats(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed statistics for a team"""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get all completed matches for the team
    matches = db.query(Match).filter(
        Match.is_completed == True,
        ((Match.team1_id == team_id) | (Match.team2_id == team_id))
    ).all()
    
    wins = 0
    losses = 0
    total_score_for = 0
    total_score_against = 0
    map_record = {}
    
    for match in matches:
        if match.team1_id == team_id:
            score_for = match.team1_score
            score_against = match.team2_score
        else:
            score_for = match.team2_score
            score_against = match.team1_score
        
        total_score_for += score_for
        total_score_against += score_against
        
        if score_for > score_against:
            wins += 1
            result = "win"
        else:
            losses += 1
            result = "loss"
        
        # Track map record
        map_name = match.map_name or "Unknown"
        if map_name not in map_record:
            map_record[map_name] = {"wins": 0, "losses": 0}
        if result == "win":
            map_record[map_name]["wins"] += 1
        else:
            map_record[map_name]["losses"] += 1
    
    return {
        "team_id": team.id,
        "team_name": team.name,
        "team_tag": team.tag,
        "total_matches": len(matches),
        "wins": wins,
        "losses": losses,
        "win_rate": round(wins / len(matches) * 100, 1) if matches else 0,
        "total_score_for": total_score_for,
        "total_score_against": total_score_against,
        "score_difference": total_score_for - total_score_against,
        "map_record": map_record
    }
