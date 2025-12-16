import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchesApi, teamsApi } from '../api';
import { 
  Plus, Calendar, MapPin, Clock, Filter, 
  ChevronDown, Swords, Trophy
} from 'lucide-react';

const MATCH_TYPES = ['ALL', 'DRAFT', 'LEAGUE', 'SCRIM'];

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matchesRes, teamsRes] = await Promise.all([
        matchesApi.getAll(),
        teamsApi.getAll()
      ]);
      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTeamById = (id) => teams.find(t => t.id === id);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
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

  // Separate played and upcoming matches
  const playedMatches = matches.filter(m => m.played_date);
  const upcomingMatches = matches.filter(m => !m.played_date && m.scheduled_date);

  // Apply filter
  const filteredPlayed = filter === 'ALL' 
    ? playedMatches 
    : playedMatches.filter(m => m.match_type === filter);
  
  const filteredUpcoming = filter === 'ALL'
    ? upcomingMatches
    : upcomingMatches.filter(m => m.match_type === filter);

  // Sort by date
  const sortedPlayed = [...filteredPlayed].sort((a, b) => 
    new Date(b.played_date) - new Date(a.played_date)
  );
  const sortedUpcoming = [...filteredUpcoming].sort((a, b) => 
    new Date(a.scheduled_date) - new Date(b.scheduled_date)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-100 mb-2">Matches</h1>
          <p className="text-gray-500">All league matches and scrims</p>
        </div>
        <div className="flex gap-3">
          {/* Filter dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {filter === 'ALL' ? 'All Types' : filter}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                <div className="absolute right-0 mt-2 w-40 bg-dark-400 border border-dark-200 rounded-lg shadow-xl z-20 overflow-hidden">
                  {MATCH_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilter(type);
                        setShowFilter(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-dark-300 transition-colors ${
                        filter === type ? 'text-primary-400 bg-dark-300' : 'text-gray-300'
                      }`}
                    >
                      {type === 'ALL' ? 'All Types' : type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link to="/matches/load" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Load Match
          </Link>
        </div>
      </div>

      {/* Upcoming Matches */}
      {sortedUpcoming.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h2 className="font-display font-semibold text-lg text-gray-200">Upcoming Matches</h2>
            <span className="ml-auto text-sm text-gray-500">{sortedUpcoming.length} scheduled</span>
          </div>
          
          <div className="divide-y divide-dark-200">
            {sortedUpcoming.map((match) => {
              const team1 = getTeamById(match.team1_id);
              const team2 = getTeamById(match.team2_id);
              
              return (
                <Link 
                  key={match.id} 
                  to={`/matches/${match.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-dark-300/50 transition-colors"
                >
                  <div className={`match-badge ${match.match_type.toLowerCase()}`}>
                    {match.match_type}
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center gap-4">
                    <div className="text-right flex-1">
                      <p className="font-display font-semibold text-gray-200">
                        {team1?.name || 'TBD'}
                      </p>
                      <p className="text-sm text-primary-400 font-mono">
                        [{team1?.tag || '???'}]
                      </p>
                    </div>
                    
                    <div className="px-4">
                      <Swords className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="text-left flex-1">
                      <p className="font-display font-semibold text-gray-200">
                        {team2?.name || 'TBD'}
                      </p>
                      <p className="text-sm text-primary-400 font-mono">
                        [{team2?.tag || '???'}]
                      </p>
                    </div>
                  </div>

                  <div className="text-right min-w-[140px]">
                    <div className="flex items-center justify-end gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(match.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-gray-500 text-sm">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(match.scheduled_date)}</span>
                    </div>
                    {match.map_name && (
                      <div className="flex items-center justify-end gap-2 text-gray-500 text-sm mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{match.map_name}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Played Matches */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-200 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary-400" />
          <h2 className="font-display font-semibold text-lg text-gray-200">Match History</h2>
          <span className="ml-auto text-sm text-gray-500">{sortedPlayed.length} played</span>
        </div>
        
        {sortedPlayed.length > 0 ? (
          <div className="divide-y divide-dark-200">
            {sortedPlayed.map((match) => {
              const team1 = getTeamById(match.team1_id);
              const team2 = getTeamById(match.team2_id);
              const team1Won = match.team1_score > match.team2_score;
              const team2Won = match.team2_score > match.team1_score;
              
              return (
                <Link 
                  key={match.id} 
                  to={`/matches/${match.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-dark-300/50 transition-colors"
                >
                  <div className={`match-badge ${match.match_type.toLowerCase()}`}>
                    {match.match_type}
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center gap-4">
                    <div className={`text-right flex-1 ${team1Won ? 'text-green-400' : ''}`}>
                      <p className="font-display font-semibold">
                        {team1?.name || 'Unknown'}
                      </p>
                      <p className={`text-sm font-mono ${team1Won ? 'text-green-400' : 'text-primary-400'}`}>
                        [{team1?.tag || '???'}]
                      </p>
                    </div>
                    
                    <div className="px-4 text-center">
                      <p className="font-mono text-2xl font-bold">
                        <span className={team1Won ? 'text-green-400' : 'text-gray-400'}>
                          {match.team1_score}
                        </span>
                        <span className="text-gray-600 mx-2">-</span>
                        <span className={team2Won ? 'text-green-400' : 'text-gray-400'}>
                          {match.team2_score}
                        </span>
                      </p>
                    </div>
                    
                    <div className={`text-left flex-1 ${team2Won ? 'text-green-400' : ''}`}>
                      <p className="font-display font-semibold">
                        {team2?.name || 'Unknown'}
                      </p>
                      <p className={`text-sm font-mono ${team2Won ? 'text-green-400' : 'text-primary-400'}`}>
                        [{team2?.tag || '???'}]
                      </p>
                    </div>
                  </div>

                  <div className="text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(match.played_date)}</span>
                    </div>
                    {match.map_name && (
                      <div className="flex items-center justify-end gap-2 text-gray-500 text-sm mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{match.map_name}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl text-gray-300 mb-2">
              No Matches Played
            </h3>
            <p className="text-gray-500 mb-6">
              Load your first match to see it here
            </p>
            <Link to="/matches/load" className="btn-primary">
              Load Match
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
