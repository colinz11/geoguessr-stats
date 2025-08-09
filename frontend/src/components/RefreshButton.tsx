import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/api';

interface RefreshButtonProps {
  onRefreshComplete?: () => void;
  className?: string;
}

export default function RefreshButton({ onRefreshComplete, className = '' }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Call the sync API endpoint and paginate until the end
      const response = await apiClient.refreshAllData();
      
      if (response.success) {
        setLastRefresh(new Date().toLocaleTimeString());
        
        const { gamesAdded, roundsAdded, totalGames, totalRounds } = response.data;
        
        // Show success message with sync results
        alert(
          `✅ Data Sync Completed!\n\n` +
          `• Games added: ${gamesAdded}\n` +
          `• Rounds added: ${roundsAdded}\n` +
          `• Total games: ${totalGames}\n` +
          `• Total rounds: ${totalRounds}\n\n` +
          `The page will now reload to show updated data.`
        );
        
        // Notify parent component to reload data
        onRefreshComplete?.();
      } else {
        throw new Error(response.message || 'Sync failed');
      }
      
    } catch (error) {
      console.error('Refresh error:', error);
      alert('❌ Sync failed. Please check if the backend server is running and try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200
          ${isRefreshing
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
          }
        `}
      >
        <RefreshCw 
          className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        {isRefreshing ? 'Syncing...' : 'Sync Data'}
      </button>
      
      {lastRefresh && (
        <span className="text-sm text-gray-500">
          Last: {lastRefresh}
        </span>
      )}
    </div>
  );
}
