import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { playersApi, teamsApi } from '../api';
import { UserCircle, Plus, X, Search, Target, Skull, Flag } from 'lucide-react';

function CreatePlayerModal({ isOpen, onClose, onCreated, teams }) {
  const [nickname, setNickname] = useState('');
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await playersApi.create({ 
        nickname, 
        team_id: teamId ? parseInt(teamId) : null 
      });
      setNickname('');
      setTeamId('');
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create player');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content w-full max-w-md">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-gray-200">Create Player</h2>
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
              <label className="label">Team (Optional)</label>
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
                {loading ? 'Creating...' : 'Create Player'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        playersApi.getAll(),
        teamsApi.getAll()
      ]);
      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.tag : null;
  };

  const filteredPlayers = players.filter(player =>
    player.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateKD = (kills, deaths) => {
    if (deaths === 0) return kills > 0 ? kills.toFixed(2) : '0.00';
    return (kills / deaths).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-100 mb-2">Players</h1>
          <p className="text-gray-500">All registered players in the league</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Player
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-12"
          placeholder="Search players..."
        />
      </div>

      {/* Players table */}
      {filteredPlayers.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Player</th>
                <th className="table-header">Team</th>
                <th className="table-header text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-4 h-4" /> Kills
                  </div>
                </th>
                <th className="table-header text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Skull className="w-4 h-4" /> Deaths
                  </div>
                </th>
                <th className="table-header text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flag className="w-4 h-4" /> Flags
                  </div>
                </th>
                <th className="table-header text-center">K/D</th>
                <th className="table-header text-center">Matches</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-dark-300/50 transition-colors">
                  <td className="table-cell">
                    <Link 
                      to={`/players/${player.id}`}
                      className="flex items-center gap-3 hover:text-primary-400 transition-colors"
                    >
                      <div className="w-8 h-8 bg-dark-200 rounded-full flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-gray-500" />
                      </div>
                      <span className="font-medium">{player.nickname}</span>
                    </Link>
                  </td>
                  <td className="table-cell">
                    {player.team_id ? (
                      <span className="font-mono text-primary-400">
                        [{getTeamName(player.team_id)}]
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="table-cell text-center font-mono text-green-400">
                    {player.total_kills}
                  </td>
                  <td className="table-cell text-center font-mono text-red-400">
                    {player.total_deaths}
                  </td>
                  <td className="table-cell text-center font-mono text-blue-400">
                    {player.total_flags}
                  </td>
                  <td className="table-cell text-center font-mono text-yellow-400">
                    {calculateKD(player.total_kills, player.total_deaths)}
                  </td>
                  <td className="table-cell text-center text-gray-400">
                    {player.matches_played}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <UserCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-gray-300 mb-2">
            {searchQuery ? 'No Players Found' : 'No Players Yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Try a different search term' : 'Add your first player to get started'}
          </p>
          {!searchQuery && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Add Player
            </button>
          )}
        </div>
      )}

      {/* Create modal */}
      <CreatePlayerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadData}
        teams={teams}
      />
    </div>
  );
}
