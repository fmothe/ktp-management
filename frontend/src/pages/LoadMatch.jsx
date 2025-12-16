import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesApi, teamsApi, playersApi } from '../api';
import { 
  ArrowLeft, Plus, X, Save, Users, AlertCircle,
  Target, Skull, Flag, UserPlus
} from 'lucide-react';

const MATCH_TYPES = ['DRAFT', 'LEAGUE', 'SCRIM'];
const COMMON_MAPS = [
  'dod_anzio', 'dod_avalanche', 'dod_caen', 'dod_charlie', 
  'dod_chemille', 'dod_donner', 'dod_escape', 'dod_flash',
  'dod_forest', 'dod_glider', 'dod_jagd', 'dod_kalt',
  'dod_kraftstoff', 'dod_merderet', 'dod_saints', 'dod_sturm',
  'dod_switch', 'dod_vicenza', 'dod_zalec'
];

function PlayerStatsRow({ player, stats, half, onChange, onRemove, isRinger }) {
  const updateStat = (field, value) => {
    const numValue = parseInt(value) || 0;
    onChange(half, { ...stats, [field]: Math.max(0, numValue) });
  };

  return (
    <tr className="hover:bg-dark-300/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-200">{player.nickname}</span>
          {isRinger && (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
              RINGER
            </span>
          )}
        </div>
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stats.kills}
          onChange={(e) => updateStat('kills', e.target.value)}
          className="w-16 px-2 py-1 bg-dark-300 border border-dark-200 rounded text-center font-mono text-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stats.deaths}
          onChange={(e) => updateStat('deaths', e.target.value)}
          className="w-16 px-2 py-1 bg-dark-300 border border-dark-200 rounded text-center font-mono text-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stats.flags}
          onChange={(e) => updateStat('flags', e.target.value)}
          className="w-16 px-2 py-1 bg-dark-300 border border-dark-200 rounded text-center font-mono text-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none"
        />
      </td>
      <td className="px-2 py-3 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function TeamPlayersSection({ 
  team, 
  teamPlayers, 
  allPlayers, 
  selectedPlayers, 
  playerStats, 
  onAddPlayer, 
  onRemovePlayer, 
  onUpdateStats,
  half,
  matchType,
  onAddRinger
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRingerDropdown, setShowRingerDropdown] = useState(false);

  // Players available to add (from this team, not already selected)
  const availablePlayers = teamPlayers.filter(
    p => !selectedPlayers.some(sp => sp.id === p.id)
  );

  // All players available as ringers (not already in either team)
  const availableRingers = allPlayers.filter(
    p => !selectedPlayers.some(sp => sp.id === p.id)
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-dark-200 bg-dark-300/30">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg text-gray-200">
            [{team.tag}] {team.name}
          </h3>
          <span className="text-sm text-gray-500">
            {selectedPlayers.length}/6 players
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Players Table */}
        {selectedPlayers.length > 0 ? (
          <table className="w-full mb-4">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-3 h-3" /> Kills
                  </div>
                </th>
                <th className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Skull className="w-3 h-3" /> Deaths
                  </div>
                </th>
                <th className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flag className="w-3 h-3" /> Flags
                  </div>
                </th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {selectedPlayers.map((player) => (
                <PlayerStatsRow
                  key={player.id}
                  player={player}
                  stats={playerStats[player.id]?.[half] || { kills: 0, deaths: 0, flags: 0 }}
                  half={half}
                  onChange={(h, stats) => onUpdateStats(player.id, h, stats)}
                  onRemove={() => onRemovePlayer(player.id)}
                  isRinger={player.isRinger}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No players added yet</p>
          </div>
        )}

        {/* Add Player Button */}
        <div className="flex gap-2">
          {selectedPlayers.length < 6 && (
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full btn-secondary flex items-center justify-center gap-2"
                disabled={availablePlayers.length === 0}
              >
                <Plus className="w-4 h-4" />
                Add Player
              </button>

              {showDropdown && availablePlayers.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-2 bg-dark-400 border border-dark-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                    {availablePlayers.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          onAddPlayer(player);
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-dark-300 transition-colors"
                      >
                        {player.nickname}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add Ringer (only for SCRIM matches) */}
          {matchType === 'SCRIM' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRingerDropdown(!showRingerDropdown)}
                className="btn-secondary flex items-center gap-2 text-yellow-400 border-yellow-500/30 hover:border-yellow-500/50"
                disabled={availableRingers.length === 0}
              >
                <UserPlus className="w-4 h-4" />
                Add Ringer
              </button>

              {showRingerDropdown && availableRingers.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRingerDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-dark-400 border border-dark-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                    {availableRingers.map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => {
                          onAddRinger(player);
                          setShowRingerDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-dark-300 transition-colors flex items-center justify-between"
                      >
                        <span>{player.nickname}</span>
                        {player.team_id && (
                          <span className="text-xs text-gray-500">
                            {allPlayers.find(p => p.id === player.id)?.team?.tag || ''}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoadMatch() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [matchType, setMatchType] = useState('LEAGUE');
  const [mapName, setMapName] = useState('');
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [playedDate, setPlayedDate] = useState(new Date().toISOString().split('T')[0]);

  // Players and stats
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [currentHalf, setCurrentHalf] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        teamsApi.getAll(),
        playersApi.getAll()
      ]);
      setTeams(teamsRes.data);
      setAllPlayers(playersRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamPlayers = (teamId) => {
    return allPlayers.filter(p => p.team_id === parseInt(teamId));
  };

  const handleAddPlayer = (teamNum, player, isRinger = false) => {
    const playerWithRinger = { ...player, isRinger };
    
    if (teamNum === 1) {
      setTeam1Players([...team1Players, playerWithRinger]);
    } else {
      setTeam2Players([...team2Players, playerWithRinger]);
    }

    // Initialize stats for both halves
    setPlayerStats(prev => ({
      ...prev,
      [player.id]: {
        1: { kills: 0, deaths: 0, flags: 0 },
        2: { kills: 0, deaths: 0, flags: 0 }
      }
    }));
  };

  const handleRemovePlayer = (teamNum, playerId) => {
    if (teamNum === 1) {
      setTeam1Players(team1Players.filter(p => p.id !== playerId));
    } else {
      setTeam2Players(team2Players.filter(p => p.id !== playerId));
    }

    // Remove stats
    const newStats = { ...playerStats };
    delete newStats[playerId];
    setPlayerStats(newStats);
  };

  const handleUpdateStats = (playerId, half, stats) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [half]: stats
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!team1Id || !team2Id) {
      setError('Please select both teams');
      return;
    }

    if (team1Id === team2Id) {
      setError('Teams must be different');
      return;
    }

    if (!mapName) {
      setError('Please select or enter a map name');
      return;
    }

    if (team1Players.length === 0 || team2Players.length === 0) {
      setError('Each team must have at least one player');
      return;
    }

    setSaving(true);

    try {
      // Build player stats array
      const stats = [];

      [...team1Players, ...team2Players].forEach(player => {
        const teamId = team1Players.includes(player) ? parseInt(team1Id) : parseInt(team2Id);
        const pStats = playerStats[player.id] || { 1: {}, 2: {} };

        // Half 1
        stats.push({
          player_id: player.id,
          team_id: teamId,
          half: 1,
          kills: pStats[1]?.kills || 0,
          deaths: pStats[1]?.deaths || 0,
          flags: pStats[1]?.flags || 0,
          is_ringer: player.isRinger || false
        });

        // Half 2
        stats.push({
          player_id: player.id,
          team_id: teamId,
          half: 2,
          kills: pStats[2]?.kills || 0,
          deaths: pStats[2]?.deaths || 0,
          flags: pStats[2]?.flags || 0,
          is_ringer: player.isRinger || false
        });
      });

      const matchData = {
        match_type: matchType,
        team1_id: parseInt(team1Id),
        team2_id: parseInt(team2Id),
        team1_score: parseInt(team1Score),
        team2_score: parseInt(team2Score),
        map_name: mapName,
        played_date: playedDate,
        player_stats: stats
      };

      const response = await matchesApi.load(matchData);
      navigate(`/matches/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save match');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading...</div>
      </div>
    );
  }

  const team1 = teams.find(t => t.id === parseInt(team1Id));
  const team2 = teams.find(t => t.id === parseInt(team2Id));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/matches')} className="btn-secondary p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-100">Load Match</h1>
          <p className="text-gray-500">Enter match results and player statistics</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Info */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-lg text-gray-200 mb-4">Match Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Match Type */}
            <div>
              <label className="label">Match Type</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="select"
              >
                {MATCH_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Map */}
            <div>
              <label className="label">Map</label>
              <select
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                className="select"
              >
                <option value="">Select map...</option>
                {COMMON_MAPS.map(map => (
                  <option key={map} value={map}>{map}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="label">Date Played</label>
              <input
                type="date"
                value={playedDate}
                onChange={(e) => setPlayedDate(e.target.value)}
                className="input"
              />
            </div>

            {/* Score */}
            <div>
              <label className="label">Final Score</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="input w-20 text-center font-mono"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="input w-20 text-center font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Team 1</label>
            <select
              value={team1Id}
              onChange={(e) => {
                setTeam1Id(e.target.value);
                setTeam1Players([]);
              }}
              className="select"
            >
              <option value="">Select team...</option>
              {teams.filter(t => !t.is_free_agents).map(team => (
                <option key={team.id} value={team.id} disabled={team.id === parseInt(team2Id)}>
                  [{team.tag}] {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Team 2</label>
            <select
              value={team2Id}
              onChange={(e) => {
                setTeam2Id(e.target.value);
                setTeam2Players([]);
              }}
              className="select"
            >
              <option value="">Select team...</option>
              {teams.filter(t => !t.is_free_agents).map(team => (
                <option key={team.id} value={team.id} disabled={team.id === parseInt(team1Id)}>
                  [{team.tag}] {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Half Tabs */}
        {team1Id && team2Id && (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentHalf(1)}
                className={`px-6 py-3 rounded-lg font-display font-semibold transition-all ${
                  currentHalf === 1
                    ? 'bg-primary-500 text-dark-500'
                    : 'bg-dark-400 text-gray-400 hover:text-gray-200'
                }`}
              >
                Half 1
              </button>
              <button
                type="button"
                onClick={() => setCurrentHalf(2)}
                className={`px-6 py-3 rounded-lg font-display font-semibold transition-all ${
                  currentHalf === 2
                    ? 'bg-primary-500 text-dark-500'
                    : 'bg-dark-400 text-gray-400 hover:text-gray-200'
                }`}
              >
                Half 2
              </button>
            </div>

            {/* Player Stats Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {team1 && (
                <TeamPlayersSection
                  team={team1}
                  teamPlayers={getTeamPlayers(team1Id)}
                  allPlayers={allPlayers}
                  selectedPlayers={team1Players}
                  playerStats={playerStats}
                  onAddPlayer={(player) => handleAddPlayer(1, player)}
                  onRemovePlayer={(playerId) => handleRemovePlayer(1, playerId)}
                  onUpdateStats={handleUpdateStats}
                  half={currentHalf}
                  matchType={matchType}
                  onAddRinger={(player) => handleAddPlayer(1, player, true)}
                />
              )}

              {team2 && (
                <TeamPlayersSection
                  team={team2}
                  teamPlayers={getTeamPlayers(team2Id)}
                  allPlayers={allPlayers}
                  selectedPlayers={team2Players}
                  playerStats={playerStats}
                  onAddPlayer={(player) => handleAddPlayer(2, player)}
                  onRemovePlayer={(playerId) => handleRemovePlayer(2, playerId)}
                  onUpdateStats={handleUpdateStats}
                  half={currentHalf}
                  matchType={matchType}
                  onAddRinger={(player) => handleAddPlayer(2, player, true)}
                />
              )}
            </div>
          </>
        )}

        {/* SCRIM Warning */}
        {matchType === 'SCRIM' && (
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">SCRIM Match</p>
              <p className="text-sm text-yellow-400/80">
                Stats from this match will NOT count towards player and team totals.
                Ringers can be added from any team.
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/matches')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Match'}
          </button>
        </div>
      </form>
    </div>
  );
}
