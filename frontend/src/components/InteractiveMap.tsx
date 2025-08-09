import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { type LatLngExpression } from 'leaflet';
import L from 'leaflet';
import Layout from './Layout';
import Loading from './Loading';
import RefreshButton from './RefreshButton';
import { apiClient, type RoundData } from '../lib/api';
import { formatScore, formatDistance, getMarkerColor, generateDemoUserId } from '../lib/utils';
import { getCountryName } from '../lib/countries';
import { Filter, RotateCcw, MapPin } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom marker icons
const createMarkerIcon = (color: string, isGuess: boolean = false) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ${isGuess ? 'border-style: dashed;' : ''}
      "></div>
    `,
    className: 'custom-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

interface FilterState {
  minScore: number;
  maxScore: number;
  countries: string[];
  showConnections: boolean;
}

export default function InteractiveMap() {
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minScore: 0,
    maxScore: 5000,
    countries: [],
    showConnections: true,
  });

  useEffect(() => {
    loadMapData();
  }, [filters]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = generateDemoUserId();
      const params: any = { limit: 500 };
      
      // Only include userId if it's not empty
      if (userId) params.userId = userId;
      
      if (filters.minScore > 0) params.minScore = filters.minScore;
      if (filters.maxScore < 5000) params.maxScore = filters.maxScore;
      if (filters.countries.length > 0) params.countries = filters.countries.join(',');
      
      const response = await apiClient.getMapRounds(params);
      
      if (response.success) {
        setRounds(response.data.rounds);
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
      setError('Failed to load map data. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      minScore: 0,
      maxScore: 5000,
      countries: [],
      showConnections: true,
    });
  };

  // Memoize the map to prevent re-renders
  const mapComponent = useMemo(() => (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl"
      key="geoguessr-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {rounds.map((round, index) => {
        const actualPos: LatLngExpression = [round.actual_lat, round.actual_lng];
        const guessPos: LatLngExpression = [round.guess_lat, round.guess_lng];
        const markerColor = getMarkerColor(round.score);
        const actualCountryName = getCountryName(round.actual_country_code);
        const guessCountryName = round.country_guess ? getCountryName(round.country_guess) : 'Unknown';
        
        return (
          <React.Fragment key={`round-${index}-${round.round_number}`}>
            {/* Actual location marker */}
            <Marker
              position={actualPos}
              icon={createMarkerIcon(markerColor, false)}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <div className="font-semibold text-blue-700 mb-1">📍 Actual Location</div>
                  <div className="space-y-1">
                    <div><strong>Round:</strong> {round.round_number}</div>
                    <div><strong>Country:</strong> {actualCountryName} ({round.actual_country_code})</div>
                    <div><strong>Score:</strong> <span className={round.score >= 4000 ? 'text-green-600' : round.score >= 2000 ? 'text-yellow-600' : 'text-red-600'}>{formatScore(round.score)}</span></div>
                    <div><strong>Distance:</strong> {formatDistance(round.distance_km)}</div>
                    {round.game.map_name && (
                      <div className="text-xs text-gray-500 mt-2 pt-1 border-t">
                        Map: {round.game.map_name}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Guess location marker */}
            {round.country_guess && (
              <Marker
                position={guessPos}
                icon={createMarkerIcon('#ef4444', true)}
              >
                <Popup>
                  <div className="text-sm min-w-[200px]">
                    <div className="font-semibold text-red-700 mb-1">🎯 Your Guess</div>
                    <div className="space-y-1">
                      <div><strong>Round:</strong> {round.round_number}</div>
                      <div><strong>Guessed:</strong> {guessCountryName}</div>
                      <div><strong>Distance:</strong> {formatDistance(round.distance_km)}</div>
                      <div className={round.is_correct_country ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {round.is_correct_country ? '✓ Correct Country!' : '✗ Wrong Country'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 pt-1 border-t">
                        Actual: {actualCountryName}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Connection line */}
            {filters.showConnections && round.country_guess && (
              <Polyline
                positions={[actualPos, guessPos]}
                color={markerColor}
                weight={2}
                opacity={0.7}
                dashArray={round.is_correct_country ? undefined : '5, 5'}
              />
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>
  ), [rounds, filters.showConnections]);

  if (loading) {
    return (
      <Layout currentPage="Interactive Map">
        <Loading size="lg" text="Loading map data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="Interactive Map">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Map</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={loadMapData} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="Interactive Map">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interactive Map</h1>
            <p className="mt-2 text-gray-600">
              View your GeoGuessr guesses plotted on an interactive world map
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <RefreshButton onRefreshComplete={loadMapData} />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button onClick={resetFilters} className="btn-secondary flex items-center">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{rounds.length}</div>
            <div className="text-sm text-gray-600">Total Rounds</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {rounds.filter(r => r.is_correct_country).length}
            </div>
            <div className="text-sm text-gray-600">Correct Countries</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">
              {rounds.length > 0 ? Math.round(rounds.reduce((sum, r) => sum + r.score, 0) / rounds.length) : 0}
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(rounds.map(r => r.actual_country_code)).size}
            </div>
            <div className="text-sm text-gray-600">Countries Visited</div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Score
                </label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={filters.minScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{filters.minScore} points</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Score
                </label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={filters.maxScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{filters.maxScore} points</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Show Connections
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showConnections}
                    onChange={(e) => setFilters(prev => ({ ...prev, showConnections: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Draw lines between actual and guess locations</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="card p-0 overflow-hidden">
          <div className="h-96 md:h-[600px]">
            {mapComponent}
          </div>
        </div>

        {/* Legend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-sm"></div>
                <span className="text-sm">Excellent Score (4500-5000)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-600 rounded-full border-2 border-white shadow-sm"></div>
                <span className="text-sm">Good Score (3000-4499)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-600 rounded-full border-2 border-white shadow-sm"></div>
                <span className="text-sm">Fair Score (1500-2999)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-sm"></div>
                <span className="text-sm">Low Score (0-1499)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                <span className="text-sm">Actual Location</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-sm border-dashed"></div>
                <span className="text-sm">Your Guess</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-0.5 bg-gray-600"></div>
                <span className="text-sm">Connection Line (solid = correct country)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-0.5 border-b-2 border-dashed border-gray-600"></div>
                <span className="text-sm">Connection Line (dashed = wrong country)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
