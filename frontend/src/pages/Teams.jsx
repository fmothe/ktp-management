import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamsApi } from '../api';
import { Users, Plus, X, Shield, UserPlus } from 'lucide-react';

function CreateTeamModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await teamsApi.create({ name, tag });
      setName('');
      setTag('');
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team');
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
            <h2 className="font-display font-semibold text-xl text-gray-200">Create Team</h2>
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
              <label className="label">Team Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g., Team Alpha"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="label">Tag (Short Name)</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                className="input"
                placeholder="e.g., ALPHA"
                required
                maxLength={10}
              />
              <p className="text-gray-500 text-xs mt-1">Max 10 characters, used in match displays</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn-primary">
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamsApi.getAll();
      setTeams(response.data);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-100 mb-2">Teams</h1>
          <p className="text-gray-500">Manage league teams and rosters</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Team
        </button>
      </div>

      {/* Teams grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="card p-6 hover:border-primary-600/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  team.is_free_agents 
                    ? 'bg-gradient-to-br from-gray-500 to-gray-700' 
                    : 'bg-gradient-to-br from-primary-500 to-primary-700'
                } shadow-lg`}>
                  {team.is_free_agents ? (
                    <UserPlus className="w-7 h-7 text-white" />
                  ) : (
                    <Shield className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-lg text-gray-200 truncate group-hover:text-primary-400 transition-colors">
                      {team.name}
                    </h3>
                    {team.is_free_agents && (
                      <span className="badge bg-gray-500/20 text-gray-400 border border-gray-500/30">
                        Special
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-primary-400 text-sm mb-3">[{team.tag}]</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{team.player_count} players</span>
                    </div>
                    {!team.is_free_agents && team.player_count >= 10 && (
                      <span className="text-yellow-400 text-xs">Full</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-gray-300 mb-2">No Teams Yet</h3>
          <p className="text-gray-500 mb-6">Create your first team to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Team
          </button>
        </div>
      )}

      {/* Create modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadTeams}
      />
    </div>
  );
}
