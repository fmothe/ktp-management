import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsApi, teamsApi } from '../api';
import { 
  Trophy, Target, Skull, Flag, ChevronUp, ChevronDown,
  Medal, Users, MapPin, TrendingUp
} from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'kd', label: 'K/D Ratio', icon: TrendingUp },
  { key: 'kills', label: 'Total Kills', icon: Target },
  { key: 'deaths', label: 'Total Deaths', icon: Skull },
  { key: 'flags', label: 'Total Flags', icon: Flag },
  { key: 'matches', label: 'Matches Played', icon: Users }
];

export default function Stats() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [mapStats, setMapStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('kd');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadData();
  }, [sortBy, sortOrder]);

  const loadData = async () => {
    try {
      const [leaderboardRes, mapStatsRes, teamsRes] = await Promise.all([
        statsApi.getLeaderboard(sortBy, sortOrder),
        statsApi.getMapStats(),
        teamsApi.getAll()
      ]);
      
      setLeaderboard(leaderboardRes.data);
      setMapStats(mapStatsRes.data);
      setTeams(teamsRes.data.filter(t => !t.is_free_agents));

      // Load team stats for each team
      const teamStatsMap = {};
      for (const team of teamsRes.data.filter(t => !t.is_free_agents)) {
        try {
          const res = await statsApi.getTeamStats(team.id);
          teamStatsMap[team.id] = res.data;
        } catch (e) {
          console.error(`Failed to load stats for team ${team.id}`);
        }
      }
      setTeamStats(teamStatsMap);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const calculateKD = (kills, deaths) => {
    if (deaths === 0) return kills > 0 ? kills.toFixed(2) : '0.00';
    return (kills / deaths).toFixed(2);
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.tag : null;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-gray-500">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-gray-100 mb-2">Statistics</h1>
        <p className="text-gray-500">League leaderboards and statistics</p>
      </div>

      {/* Player Leaderboard */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-400" />
            <h2 className="font-display font-semibold text-lg text-gray-200">Player Leaderboard</h2>
          </div>
          
          {/* Sort Buttons */}
          <div className="flex gap-2">
            {SORT_OPTIONS.map(option => {
              const Icon = option.icon;
              const isActive = sortBy === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => handleSort(option.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all ${
                    isActive 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                      : 'bg-dark-300 text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {option.label}
                  {isActive && (
                    sortOrder === 'desc' 
                      ? <ChevronDown className="w-3 h-3" />
                      : <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-dark-200">
                <th className="px-4 py-3 text-left w-12">Rank</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-3 h-3" /> Kills
                  </div>
                </th>
                <th className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Skull className="w-3 h-3" /> Deaths
                  </div>
                </th>
                <th className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flag className="w-3 h-3" /> Flags
                  </div>
                </th>
                <th className="px-4 py-3 text-center">K/D</th>
                <th className="px-4 py-3 text-center">Matches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {leaderboard.map((player, index) => (
                <tr 
                  key={player.id} 
                  className={`hover:bg-dark-300/30 transition-colors ${
                    index < 3 ? 'bg-dark-300/20' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {getRankBadge(index + 1)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      to={`/players/${player.id}`}
                      className="font-medium text-gray-200 hover:text-primary-400 transition-colors"
                    >
                      {player.nickname}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {player.team_id ? (
                      <Link 
                        to={`/teams/${player.team_id}`}
                        className="font-mono text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        [{getTeamName(player.team_id)}]
                      </Link>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-green-400">
                    {player.total_kills}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-red-400">
                    {player.total_deaths}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-blue-400">
                    {player.total_flags}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-yellow-400 font-bold">
                    {calculateKD(player.total_kills, player.total_deaths)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {player.matches_played}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No player stats available yet</p>
          </div>
        )}
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Statistics */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-200 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-400" />
            <h2 className="font-display font-semibold text-lg text-gray-200">Map Statistics</h2>
          </div>
          
          {mapStats.length > 0 ? (
            <div className="divide-y divide-dark-200">
              {mapStats.slice(0, 10).map((map, index) => (
                <div key={map.map_name} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                    <span className="font-mono text-gray-200">{map.map_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-primary-400">{map.play_count}</span>
                    <span className="text-gray-500 text-sm ml-1">plays</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No map data available
            </div>
          )}
        </div>

        {/* Team Rankings */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            <h2 className="font-display font-semibold text-lg text-gray-200">Team Rankings</h2>
          </div>
          
          {teams.length > 0 ? (
            <div className="divide-y divide-dark-200">
              {teams
                .map(team => ({
                  ...team,
                  stats: teamStats[team.id] || { wins: 0, losses: 0, draws: 0 }
                }))
                .sort((a, b) => {
                  const aWinRate = a.stats.wins / (a.stats.wins + a.stats.losses + a.stats.draws || 1);
                  const bWinRate = b.stats.wins / (b.stats.wins + b.stats.losses + b.stats.draws || 1);
                  return bWinRate - aWinRate;
                })
                .map((team, index) => {
                  const total = team.stats.wins + team.stats.losses + team.stats.draws;
                  const winRate = total > 0 
                    ? ((team.stats.wins / total) * 100).toFixed(0)
                    : 0;
                  
                  return (
                    <Link 
                      key={team.id}
                      to={`/teams/${team.id}`}
                      className="px-6 py-3 flex items-center justify-between hover:bg-dark-300/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getRankBadge(index + 1)}
                        <div>
                          <span className="font-medium text-gray-200">{team.name}</span>
                          <span className="ml-2 font-mono text-primary-400 text-sm">[{team.tag}]</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">
                          <span className="text-green-400">{team.stats.wins}W</span>
                          <span className="text-gray-600 mx-1">-</span>
                          <span className="text-red-400">{team.stats.losses}L</span>
                          {team.stats.draws > 0 && (
                            <>
                              <span className="text-gray-600 mx-1">-</span>
                              <span className="text-gray-400">{team.stats.draws}D</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {winRate}% Win Rate
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No teams available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
