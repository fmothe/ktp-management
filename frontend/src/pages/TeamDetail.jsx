import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { teamsApi, playersApi } from '../api';
import { 
  ArrowLeft, Shield, Users, Trophy, UserPlus, 
  UserMinus, Trash2, Edit2, X, Check
} from 'lucide-react';

function AddPlayerModal({ isOpen, onClose, teamId, currentPlayerIds, onAdded }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    try {
      const response = await playersApi.getAll();
      // Filter out players already in team
      const available = response.data.filter(p => !currentPlayerIds.includes(p.id));
      setPlayers(available);
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (playerId) => {
    setAdding(playerId);
    try {
      await teamsApi.addPlayer(teamId, playerId);
      onAdded();
      onClose();
    } catch (err) {
      console.error('Failed to add player:', err);
      alert(err.response?.data?.detail || 'Failed to add player');
    } finally {
      setAdding(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-gray-200">Add Player</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading players...</div>
          ) : players.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-dark-300 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-200">{player.nickname}</p>
                    <p className="text-gray-500 text-xs">
                      {player.team_id ? 'Has team' : 'No team'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(player.id)}
                    disabled={adding === player.id}
                    className="btn-primary py-1.5 px-3 text-sm"
                  >
                    {adding === player.id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No available players</p>
              <Link to="/players" onClick={onClose} className="text-primary-400 hover:text-primary-300">
                Create a player first
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTag, setEditTag] = useState('');

  useEffect(() => {
    loadTeam();
  }, [id]);

  const loadTeam = async () => {
    try {
      const response = await teamsApi.getById(id);
      setTeam(response.data);
      setEditName(response.data.name);
      setEditTag(response.data.tag);
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!confirm('Remove this player from the team?')) return;
    
    try {
      await teamsApi.removePlayer(id, playerId);
      loadTeam();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove player');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team? This cannot be undone.')) return;
    
    try {
      await teamsApi.delete(id);
      navigate('/teams');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete team');
    }
  };

  const handleSaveEdit = async () => {
    try {
      await teamsApi.update(id, { name: editName, tag: editTag });
      setEditing(false);
      loadTeam();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update team');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading team...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="card p-12 text-center">
        <h3 className="font-display font-semibold text-xl text-gray-300 mb-4">Team Not Found</h3>
        <Link to="/teams" className="btn-primary">Back to Teams</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Link to="/teams" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200">
        <ArrowLeft className="w-4 h-4" />
        Back to Teams
      </Link>

      {/* Team header */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${
            team.is_free_agents 
              ? 'bg-gradient-to-br from-gray-500 to-gray-700' 
              : 'bg-gradient-to-br from-primary-500 to-primary-700'
          } shadow-neon`}>
            <Shield className="w-10 h-10 text-white" />
          </div>
          
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input"
                  placeholder="Team name"
                />
                <input
                  type="text"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value.toUpperCase())}
                  className="input"
                  placeholder="Tag"
                  maxLength={10}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="btn-primary py-1.5 px-3 text-sm">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 px-3 text-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display font-bold text-3xl text-gray-100">{team.name}</h1>
                  {team.is_free_agents && (
                    <span className="badge bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      Special Pool
                    </span>
                  )}
                </div>
                <p className="font-mono text-primary-400 text-lg mb-4">[{team.tag}]</p>
              </>
            )}
            
            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span className="text-gray-300">{team.players?.length || 0} players</span>
                {!team.is_free_agents && (
                  <span className="text-gray-600">/ 10 max</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gray-500" />
                <span className="text-gray-300">{team.matches_played || 0} matches</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">{team.wins || 0}W</span>
                <span className="text-gray-500">/</span>
                <span className="text-red-400">{team.losses || 0}L</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!team.is_free_agents && !editing && (
            <div className="flex gap-2">
              <button 
                onClick={() => setEditing(true)} 
                className="btn-secondary p-2"
                title="Edit team"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDelete} 
                className="btn-danger p-2"
                title="Delete team"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-xl text-gray-200">Roster</h2>
          <button 
            onClick={() => setShowAddPlayer(true)} 
            className="btn-primary flex items-center gap-2"
            disabled={!team.is_free_agents && team.players?.length >= 10}
          >
            <UserPlus className="w-5 h-5" />
            Add Player
          </button>
        </div>

        {team.players?.length > 0 ? (
          <div className="space-y-2">
            {team.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-dark-300 rounded-lg group"
              >
                <Link 
                  to={`/players/${player.id}`}
                  className="flex-1 hover:text-primary-400 transition-colors"
                >
                  <p className="font-medium text-gray-200 group-hover:text-primary-400">
                    {player.nickname}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1">
                    <span>{player.total_kills} K</span>
                    <span>{player.total_deaths} D</span>
                    <span>{player.total_flags} F</span>
                    <span>{player.matches_played} matches</span>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from team"
                >
                  <UserMinus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No players in this team yet</p>
          </div>
        )}
      </div>

      {/* Add player modal */}
      <AddPlayerModal
        isOpen={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        teamId={id}
        currentPlayerIds={team.players?.map(p => p.id) || []}
        onAdded={loadTeam}
      />
    </div>
  );
}
