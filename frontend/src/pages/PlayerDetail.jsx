import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { playersApi, teamsApi, matchesApi } from '../api';
import { 
  UserCircle, ArrowLeft, Edit2, Trash2, Target, Skull, Flag, 
  Calendar, MapPin, Trophy, X, Save
} from 'lucide-react';

function EditPlayerModal({ isOpen, onClose, player, teams, onUpdated }) {
  const [nickname, setNickname] = useState(player?.nickname || '');
  const [teamId, setTeamId] = useState(player?.team_id?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (player) {
      setNickname(player.nickname);
      setTeamId(player.team_id?.toString() || '');
    }
  }, [player]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await playersApi.update(player.id, {
        nickname,
        team_id: teamId ? parseInt(teamId) : null
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !player) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content w-full max-w-md">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-gray-200">Edit Player</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input"
                placeholder="Player nickname"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="label">Team</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="select"
              >
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    [{team.tag}] {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn-primary">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [playerRes, teamsRes, matchesRes] = await Promise.all([
        playersApi.getOne(id),
        teamsApi.getAll(),
        matchesApi.getAll()
      ]);
      
      setPlayer(playerRes.data);
      setTeams(teamsRes.data);
      
      // Find player's team
      if (playerRes.data.team_id) {
        const playerTeam = teamsRes.data.find(t => t.id === playerRes.data.team_id);
        setTeam(playerTeam);
      }

      // Filter matches where player participated
      // For now, we'll just show recent matches (proper filtering needs player_match_stats endpoint)
      setMatchHistory(matchesRes.data.filter(m => m.played_date));
      
    } catch (err) {
      console.error('Failed to load player data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${player.nickname}? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await playersApi.delete(id);
      navigate('/players');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete player');
    } finally {
      setDeleting(false);
    }
  };

  const calculateKD = (kills, deaths) => {
    if (deaths === 0) return kills > 0 ? kills.toFixed(2) : '0.00';
    return (kills / deaths).toFixed(2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading player...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-display text-gray-300 mb-4">Player not found</h2>
        <Link to="/players" className="btn-primary">
          Back to Players
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/players" className="btn-secondary p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl text-gray-100">{player.nickname}</h1>
            {team && (
              <Link 
                to={`/teams/${team.id}`}
                className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded font-mono text-sm hover:bg-primary-500/30 transition-colors"
              >
                [{team.tag}]
              </Link>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {team ? team.name : 'Free Agent'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button 
            onClick={handleDelete} 
            disabled={deleting}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider">Kills</span>
          </div>
          <p className="font-mono text-2xl font-bold text-green-400">{player.total_kills}</p>
        </div>

        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
            <Skull className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider">Deaths</span>
          </div>
          <p className="font-mono text-2xl font-bold text-red-400">{player.total_deaths}</p>
        </div>

        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
            <Flag className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider">Flags</span>
          </div>
          <p className="font-mono text-2xl font-bold text-blue-400">{player.total_flags}</p>
        </div>

        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider">K/D Ratio</span>
          </div>
          <p className="font-mono text-2xl font-bold text-yellow-400">
            {calculateKD(player.total_kills, player.total_deaths)}
          </p>
        </div>

        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider">Matches</span>
          </div>
          <p className="font-mono text-2xl font-bold text-purple-400">{player.matches_played}</p>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-lg text-gray-200 mb-4">Performance Breakdown</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kills per Match */}
          <div>
            <p className="text-gray-500 text-sm mb-1">Avg. Kills per Match</p>
            <p className="font-mono text-xl text-green-400">
              {player.matches_played > 0 
                ? (player.total_kills / player.matches_played).toFixed(1) 
                : '0.0'}
            </p>
          </div>

          {/* Deaths per Match */}
          <div>
            <p className="text-gray-500 text-sm mb-1">Avg. Deaths per Match</p>
            <p className="font-mono text-xl text-red-400">
              {player.matches_played > 0 
                ? (player.total_deaths / player.matches_played).toFixed(1) 
                : '0.0'}
            </p>
          </div>

          {/* Flags per Match */}
          <div>
            <p className="text-gray-500 text-sm mb-1">Avg. Flags per Match</p>
            <p className="font-mono text-xl text-blue-400">
              {player.matches_played > 0 
                ? (player.total_flags / player.matches_played).toFixed(1) 
                : '0.0'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-200">
          <h2 className="font-display font-semibold text-lg text-gray-200">Recent Matches</h2>
        </div>
        
        {matchHistory.length > 0 ? (
          <div className="divide-y divide-dark-200">
            {matchHistory.slice(0, 10).map((match) => (
              <Link 
                key={match.id} 
                to={`/matches/${match.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-dark-300/50 transition-colors"
              >
                <div className={`match-badge ${match.match_type.toLowerCase()}`}>
                  {match.match_type}
                </div>
                <div className="flex-1">
                  <p className="text-gray-200">
                    {match.team1?.tag || 'TBD'} vs {match.team2?.tag || 'TBD'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{match.map_name || 'TBD'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg">
                    <span className="text-primary-400">{match.team1_score}</span>
                    <span className="text-gray-500 mx-1">-</span>
                    <span className="text-primary-400">{match.team2_score}</span>
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(match.played_date)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            No match history available
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditPlayerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        player={player}
        teams={teams}
        onUpdated={loadData}
      />
    </div>
  );
}
