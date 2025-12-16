import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../api';
import { 
  Trophy, 
  Users, 
  UserCircle, 
  Swords, 
  Map, 
  Target,
  Flag,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, subtext, color = 'primary' }) {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-700',
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{label}</p>
          <p className="font-display font-bold text-3xl text-gray-100">{value}</p>
          {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function MatchBadge({ type }) {
  const badges = {
    DRAFT: 'badge-draft',
    LEAGUE: 'badge-league',
    SCRIM: 'badge-scrim',
  };
  return <span className={badges[type] || 'badge'}>{type}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsApi.getDashboard();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-400 font-display">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={loadStats} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-gray-100 mb-2">Dashboard</h1>
        <p className="text-gray-500">Overview of KTP League statistics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Swords}
          label="Total Matches"
          value={stats?.total_matches || 0}
          color="primary"
        />
        <StatCard
          icon={Users}
          label="Teams"
          value={stats?.total_teams || 0}
          color="blue"
        />
        <StatCard
          icon={UserCircle}
          label="Players"
          value={stats?.total_players || 0}
          color="green"
        />
        <StatCard
          icon={Map}
          label="Most Played Map"
          value={stats?.most_played_map || 'N/A'}
          subtext={stats?.most_played_map_count ? `${stats.most_played_map_count} matches` : ''}
          color="purple"
        />
      </div>

      {/* Top players */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best K/D */}
        {stats?.top_kd_player && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-gray-200">Top K/D Ratio</h3>
                <p className="text-gray-500 text-sm">Best kill/death performance</p>
              </div>
            </div>
            <Link 
              to={`/players/${stats.top_kd_player.id}`}
              className="block p-4 bg-dark-300 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xl text-primary-400">
                    {stats.top_kd_player.nickname}
                  </p>
                  <p className="text-gray-500 text-sm">{stats.top_kd_player.team_name || 'No Team'}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-2xl text-green-400">
                    {stats.top_kd_player.kd_ratio.toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {stats.top_kd_player.total_kills}K / {stats.top_kd_player.total_deaths}D
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Most Flags */}
        {stats?.top_flags_player && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-gray-200">Top Flag Capturer</h3>
                <p className="text-gray-500 text-sm">Most objectives secured</p>
              </div>
            </div>
            <Link 
              to={`/players/${stats.top_flags_player.id}`}
              className="block p-4 bg-dark-300 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xl text-primary-400">
                    {stats.top_flags_player.nickname}
                  </p>
                  <p className="text-gray-500 text-sm">{stats.top_flags_player.team_name || 'No Team'}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-2xl text-red-400">
                    {stats.top_flags_player.total_flags}
                  </p>
                  <p className="text-gray-500 text-xs">flags captured</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Recent & Upcoming matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-primary-400" />
              <h3 className="font-display font-semibold text-lg text-gray-200">Recent Matches</h3>
            </div>
            <Link to="/matches" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {stats?.recent_matches?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_matches.map((match) => (
                <Link
                  key={match.id}
                  to={`/matches/${match.id}`}
                  className="block p-3 bg-dark-300 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <MatchBadge type={match.match_type} />
                    <span className="text-gray-500 text-xs">
                      {match.played_date && format(new Date(match.played_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">{match.team1_tag || '???'}</span>
                    <span className="font-mono font-bold text-lg">
                      <span className={match.team1_score > match.team2_score ? 'text-green-400' : 'text-gray-400'}>
                        {match.team1_score}
                      </span>
                      <span className="text-gray-600 mx-2">-</span>
                      <span className={match.team2_score > match.team1_score ? 'text-green-400' : 'text-gray-400'}>
                        {match.team2_score}
                      </span>
                    </span>
                    <span className="text-gray-300 font-medium">{match.team2_tag || '???'}</span>
                  </div>
                  {match.map_name && (
                    <p className="text-gray-500 text-xs mt-1 text-center">{match.map_name}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent matches</p>
          )}
        </div>

        {/* Upcoming Matches */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-400" />
              <h3 className="font-display font-semibold text-lg text-gray-200">Upcoming Matches</h3>
            </div>
            <Link to="/matches" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats?.upcoming_matches?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcoming_matches.map((match) => (
                <Link
                  key={match.id}
                  to={`/matches/${match.id}`}
                  className="block p-3 bg-dark-300 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <MatchBadge type={match.match_type} />
                    <span className="text-primary-400 text-xs font-medium">
                      {match.scheduled_date && format(new Date(match.scheduled_date), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">{match.team1_name || 'TBD'}</span>
                    <span className="text-gray-500 text-sm">vs</span>
                    <span className="text-gray-300 font-medium">{match.team2_name || 'TBD'}</span>
                  </div>
                  {match.map_name && (
                    <p className="text-gray-500 text-xs mt-1 text-center">{match.map_name}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming matches scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
}
