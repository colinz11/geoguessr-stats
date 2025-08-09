import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, MapPin, Globe, Target, TrendingUp, Users } from 'lucide-react';
import Layout from './Layout';
import StatCard from './StatCard';
import Loading from './Loading';
import RefreshButton from './RefreshButton';
import { apiClient, type RoundData, type CountryPerformance } from '../lib/api';
import { formatNumber, formatScore, formatPercentage, generateDemoUserId } from '../lib/utils';
import { getCountryName } from '../lib/countries';

interface DashboardStats {
  totalGames: number;
  totalRounds: number;
  averageScore: number;
  bestScore: number;
  totalCountries: number;
  averageAccuracy: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRounds, setRecentRounds] = useState<RoundData[]>([]);
  const [topCountries, setTopCountries] = useState<CountryPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = generateDemoUserId();
      
      // Prepare API parameters (only include userId if it's not empty)
      const roundsParams: any = { limit: 100 };
      const countriesParams: any = {};
      if (userId) {
        roundsParams.userId = userId;
        countriesParams.userId = userId;
      }
      
      // Fetch rounds and countries data in parallel
      const [roundsResponse, countriesResponse] = await Promise.all([
        apiClient.getMapRounds(roundsParams),
        apiClient.getCountries(countriesParams)
      ]);

      if (roundsResponse.success && countriesResponse.success) {
        const rounds = roundsResponse.data.rounds;
        const countries = countriesResponse.data;

        // Calculate stats
        const games = new Set(rounds.map(r => r.game.played_at)).size;
        const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
        const correctCountries = rounds.filter(r => r.is_correct_country).length;
        
        const calculatedStats: DashboardStats = {
          totalGames: games,
          totalRounds: rounds.length,
          averageScore: rounds.length > 0 ? Math.round(totalScore / rounds.length) : 0,
          bestScore: rounds.length > 0 ? Math.max(...rounds.map(r => r.score)) : 0,
          totalCountries: countries.length,
          averageAccuracy: rounds.length > 0 ? (correctCountries / rounds.length) * 100 : 0,
        };

        setStats(calculatedStats);
        setRecentRounds(rounds.slice(0, 5)); // Show last 5 rounds
        setTopCountries(countries.slice(0, 5)); // Show top 5 countries
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout currentPage="Dashboard">
        <Loading size="lg" text="Loading dashboard data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="Dashboard">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="Dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Overview of your GeoGuessr performance and statistics
            </p>
          </div>
          <RefreshButton onRefreshComplete={loadDashboardData} />
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Games"
              value={formatNumber(stats.totalGames)}
              subtitle="Games played"
              icon={BarChart3}
              color="primary"
            />
            <StatCard
              title="Total Rounds"
              value={formatNumber(stats.totalRounds)}
              subtitle="Individual rounds"
              icon={MapPin}
              color="green"
            />
            <StatCard
              title="Average Score"
              value={formatScore(stats.averageScore)}
              subtitle="Points per round"
              icon={Target}
              color="yellow"
            />
            <StatCard
              title="Best Score"
              value={formatScore(stats.bestScore)}
              subtitle="Highest single round"
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Countries Played"
              value={formatNumber(stats.totalCountries)}
              subtitle="Unique countries"
              icon={Globe}
              color="primary"
            />
            <StatCard
              title="Country Accuracy"
              value={formatPercentage(stats.averageAccuracy)}
              subtitle="Correct country guesses"
              icon={Users}
              color={stats.averageAccuracy >= 70 ? 'green' : stats.averageAccuracy >= 50 ? 'yellow' : 'red'}
            />
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Rounds */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Rounds</h2>
            <div className="space-y-3">
              {recentRounds.map((round, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        Round {round.round_number}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-sm text-gray-600">
                        {round.game.map_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {round.actual_country_code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(round.distance_km)}km
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      round.score >= 4000 ? 'text-green-600' : 
                      round.score >= 2000 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatScore(round.score)}
                    </div>
                    {round.is_correct_country && (
                      <div className="text-xs text-green-600">✓ Correct</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/map" className="btn-secondary w-full text-center block">
                View Interactive Map
              </Link>
            </div>
          </div>

          {/* Top Countries */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Countries</h2>
            <div className="space-y-3">
              {topCountries.map((country, index) => (
                <div key={country.country_code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">
                      {String.fromCodePoint(
                        ...country.country_code.split('').map(char => 127397 + char.charCodeAt(0))
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getCountryName(country.country_code)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {country.totalRounds} rounds • {country.country_code}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      country.accuracy >= 80 ? 'text-green-600' : 
                      country.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(country.accuracy)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatScore(country.avgScore)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/countries" className="btn-secondary w-full text-center block">
                View All Countries
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/map"
              className="flex items-center p-4 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <MapPin className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <div className="font-medium text-primary-900">Interactive Map</div>
                <div className="text-sm text-primary-600">View your guesses on a world map</div>
              </div>
            </Link>
            <Link
              to="/countries"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Globe className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-green-900">Country Analysis</div>
                <div className="text-sm text-green-600">Detailed country performance</div>
              </div>
            </Link>
            <Link
              to="/settings"
              className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Settings</div>
                <div className="text-sm text-gray-600">Configure your preferences</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
