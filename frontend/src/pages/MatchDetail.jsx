import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { matchesApi, teamsApi } from '../api';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Target, Skull, Flag, 
  Trophy, Edit2, Trash2, Users
} from 'lucide-react';

export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [matchRes, teamsRes] = await Promise.all([
        matchesApi.getOne(id),
        teamsApi.getAll()
      ]);
      setMatch(matchRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error('Failed to load match:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamById = (teamId) => teams.find(t => t.id === teamId);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this match? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await matchesApi.delete(id);
      navigate('/matches');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete match');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading match...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-display text-gray-300 mb-4">Match not found</h2>
        <Link to="/matches" className="btn-primary">
          Back to Matches
        </Link>
      </div>
    );
  }

  const team1 = getTeamById(match.team1_id);
  const team2 = getTeamById(match.team2_id);
  const isPlayed = !!match.played_date;
  const team1Won = match.team1_score > match.team2_score;
  const team2Won = match.team2_score > match.team1_score;

  // Group player stats by team and half
  const team1Stats = match.player_stats?.filter(s => s.team_id === match.team1_id) || [];
  const team2Stats = match.player_stats?.filter(s => s.team_id === match.team2_id) || [];

  // Aggregate stats for each player across both halves
  const aggregateStats = (stats) => {
    const playerMap = new Map();
    
    stats.forEach(stat => {
      const key = stat.player_id;
      if (!playerMap.has(key)) {
        playerMap.set(key, {
          player: stat.player,
          is_ringer: stat.is_ringer,
          half1: { kills: 0, deaths: 0, flags: 0 },
          half2: { kills: 0, deaths: 0, flags: 0 },
          total: { kills: 0, deaths: 0, flags: 0 }
        });
      }
      
      const player = playerMap.get(key);
      const halfKey = stat.half === 1 ? 'half1' : 'half2';
      player[halfKey] = {
        kills: stat.kills,
        deaths: stat.deaths,
        flags: stat.flags
      };
      player.total.kills += stat.kills;
      player.total.deaths += stat.deaths;
      player.total.flags += stat.flags;
    });
    
    return Array.from(playerMap.values());
  };

  const team1Aggregated = aggregateStats(team1Stats);
  const team2Aggregated = aggregateStats(team2Stats);

  const TeamStatsTable = ({ teamStats, teamName, isWinner }) => (
    <div className="card overflow-hidden">
      <div className={`px-6 py-4 border-b border-dark-200 ${isWinner ? 'bg-green-500/10' : ''}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-display font-semibold text-lg ${isWinner ? 'text-green-400' : 'text-gray-200'}`}>
            {teamName}
            {isWinner && <Trophy className="inline-block w-5 h-5 ml-2" />}
          </h3>
          <span className="text-sm text-gray-500">{teamStats.length} players</span>
        </div>
      </div>
      
      {teamStats.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-dark-200">
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-2 py-3 text-center" colSpan="3">Half 1</th>
              <th className="px-2 py-3 text-center" colSpan="3">Half 2</th>
              <th className="px-2 py-3 text-center" colSpan="3">Total</th>
            </tr>
            <tr className="text-xs text-gray-600 border-b border-dark-200">
              <th></th>
              <th className="px-2 py-1 text-center">K</th>
              <th className="px-2 py-1 text-center">D</th>
              <th className="px-2 py-1 text-center">F</th>
              <th className="px-2 py-1 text-center">K</th>
              <th className="px-2 py-1 text-center">D</th>
              <th className="px-2 py-1 text-center">F</th>
              <th className="px-2 py-1 text-center">K</th>
              <th className="px-2 py-1 text-center">D</th>
              <th className="px-2 py-1 text-center">F</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-200">
            {teamStats.map((stat, idx) => (
              <tr key={idx} className="hover:bg-dark-300/30 transition-colors">
                <td className="px-4 py-3">
                  <Link 
                    to={`/players/${stat.player?.id}`}
                    className="font-medium text-gray-200 hover:text-primary-400 transition-colors"
                  >
                    {stat.player?.nickname || 'Unknown'}
                    {stat.is_ringer && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                        RINGER
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-2 py-3 text-center font-mono text-green-400">{stat.half1.kills}</td>
                <td className="px-2 py-3 text-center font-mono text-red-400">{stat.half1.deaths}</td>
                <td className="px-2 py-3 text-center font-mono text-blue-400">{stat.half1.flags}</td>
                <td className="px-2 py-3 text-center font-mono text-green-400">{stat.half2.kills}</td>
                <td className="px-2 py-3 text-center font-mono text-red-400">{stat.half2.deaths}</td>
                <td className="px-2 py-3 text-center font-mono text-blue-400">{stat.half2.flags}</td>
                <td className="px-2 py-3 text-center font-mono text-green-500 font-bold">{stat.total.kills}</td>
                <td className="px-2 py-3 text-center font-mono text-red-500 font-bold">{stat.total.deaths}</td>
                <td className="px-2 py-3 text-center font-mono text-blue-500 font-bold">{stat.total.flags}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-dark-100 bg-dark-300/30">
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-400">Team Total</td>
              <td className="px-2 py-3 text-center font-mono text-green-400">
                {teamStats.reduce((sum, s) => sum + s.half1.kills, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-red-400">
                {teamStats.reduce((sum, s) => sum + s.half1.deaths, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-blue-400">
                {teamStats.reduce((sum, s) => sum + s.half1.flags, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-green-400">
                {teamStats.reduce((sum, s) => sum + s.half2.kills, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-red-400">
                {teamStats.reduce((sum, s) => sum + s.half2.deaths, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-blue-400">
                {teamStats.reduce((sum, s) => sum + s.half2.flags, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-green-500 font-bold">
                {teamStats.reduce((sum, s) => sum + s.total.kills, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-red-500 font-bold">
                {teamStats.reduce((sum, s) => sum + s.total.deaths, 0)}
              </td>
              <td className="px-2 py-3 text-center font-mono text-blue-500 font-bold">
                {teamStats.reduce((sum, s) => sum + s.total.flags, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <div className="px-6 py-8 text-center text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No player stats recorded
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/matches" className="btn-secondary p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`match-badge ${match.match_type.toLowerCase()}`}>
              {match.match_type}
            </span>
            <h1 className="font-display font-bold text-2xl text-gray-100">
              {team1?.name || 'TBD'} vs {team2?.name || 'TBD'}
            </h1>
          </div>
        </div>
        <button 
          onClick={handleDelete} 
          disabled={deleting}
          className="btn-danger flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Match Info */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Team 1 */}
          <div className={`flex-1 text-center ${team1Won ? 'text-green-400' : ''}`}>
            <Link 
              to={`/teams/${team1?.id}`}
              className="hover:opacity-80 transition-opacity"
            >
              <p className="font-mono text-lg text-primary-400 mb-1">
                [{team1?.tag || '???'}]
              </p>
              <h2 className={`font-display font-bold text-2xl ${team1Won ? 'text-green-400' : 'text-gray-200'}`}>
                {team1?.name || 'TBD'}
              </h2>
            </Link>
            {team1Won && (
              <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                <Trophy className="w-4 h-4" />
                <span>Winner</span>
              </div>
            )}
          </div>

          {/* Score */}
          <div className="text-center px-8">
            {isPlayed ? (
              <div className="font-mono text-5xl font-bold">
                <span className={team1Won ? 'text-green-400' : 'text-gray-400'}>
                  {match.team1_score}
                </span>
                <span className="text-gray-600 mx-4">-</span>
                <span className={team2Won ? 'text-green-400' : 'text-gray-400'}>
                  {match.team2_score}
                </span>
              </div>
            ) : (
              <div className="text-gray-500 font-display text-xl">vs</div>
            )}
          </div>

          {/* Team 2 */}
          <div className={`flex-1 text-center ${team2Won ? 'text-green-400' : ''}`}>
            <Link 
              to={`/teams/${team2?.id}`}
              className="hover:opacity-80 transition-opacity"
            >
              <p className="font-mono text-lg text-primary-400 mb-1">
                [{team2?.tag || '???'}]
              </p>
              <h2 className={`font-display font-bold text-2xl ${team2Won ? 'text-green-400' : 'text-gray-200'}`}>
                {team2?.name || 'TBD'}
              </h2>
            </Link>
            {team2Won && (
              <div className="mt-2 flex items-center justify-center gap-1 text-sm">
                <Trophy className="w-4 h-4" />
                <span>Winner</span>
              </div>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-6 pt-6 border-t border-dark-200 flex flex-wrap items-center justify-center gap-6 text-gray-400">
          {match.map_name && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{match.map_name}</span>
            </div>
          )}
          {isPlayed ? (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(match.played_date)}</span>
            </div>
          ) : match.scheduled_date && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(match.scheduled_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatTime(match.scheduled_date)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Player Stats */}
      {isPlayed && (
        <div className="grid grid-cols-1 gap-6">
          <TeamStatsTable 
            teamStats={team1Aggregated} 
            teamName={team1?.name || 'Team 1'} 
            isWinner={team1Won}
          />
          <TeamStatsTable 
            teamStats={team2Aggregated} 
            teamName={team2?.name || 'Team 2'} 
            isWinner={team2Won}
          />
        </div>
      )}

      {/* If not played yet */}
      {!isPlayed && (
        <div className="card p-8 text-center">
          <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-gray-200 mb-2">
            Match Not Yet Played
          </h3>
          <p className="text-gray-500 mb-6">
            This match is scheduled for {formatDate(match.scheduled_date)} at {formatTime(match.scheduled_date)}
          </p>
          <Link to="/matches/load" className="btn-primary">
            Load Match Results
          </Link>
        </div>
      )}
    </div>
  );
}
