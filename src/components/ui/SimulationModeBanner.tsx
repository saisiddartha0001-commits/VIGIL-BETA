import React from 'react';

type DataMode = 'SIMULATED' | 'LIVE' | 'CACHED';

interface SimulationModeBannerProps {
  dataMode: DataMode;
  onModeChange: (mode: DataMode) => void;
}

export const SimulationModeBanner: React.FC<SimulationModeBannerProps> = ({
  dataMode,
  onModeChange,
}) => {
  const getBannerColor = () => {
    switch (dataMode) {
      case 'SIMULATED':
        return 'bg-amber-900/90 border-amber-500';
      case 'LIVE':
        return 'bg-green-900/90 border-green-500';
      case 'CACHED':
        return 'bg-blue-900/90 border-blue-500';
      default:
        return 'bg-gray-900/90 border-gray-500';
    }
  };

  const getBannerText = () => {
    switch (dataMode) {
      case 'SIMULATED':
        return 'SIMULATION ENVIRONMENT — Values are generated or derived for demonstration. They are not live sensor observations or operational collision predictions.';
      case 'LIVE':
        return 'LIVE DATA MODE — Connected to live orbital data sources. Values reflect current observations.';
      case 'CACHED':
        return 'CACHED DATA MODE — Using cached data. Refresh recommended for latest observations.';
      default:
        return '';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 border-b backdrop-blur-sm ${getBannerColor()}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            dataMode === 'SIMULATED' ? 'bg-amber-400' :
            dataMode === 'LIVE' ? 'bg-green-400' : 'bg-blue-400'
          }`} />
          <span className="text-xs font-mono text-white/90 font-semibold tracking-wide">
            {getBannerText()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange('SIMULATED')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              dataMode === 'SIMULATED'
                ? 'bg-amber-500 text-white'
                : 'bg-black/30 text-white/70 hover:bg-black/50'
            }`}
          >
            SIMULATION
          </button>
          <button
            onClick={() => onModeChange('LIVE')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              dataMode === 'LIVE'
                ? 'bg-green-500 text-white'
                : 'bg-black/30 text-white/70 hover:bg-black/50'
            }`}
          >
            LIVE
          </button>
          <button
            onClick={() => onModeChange('CACHED')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              dataMode === 'CACHED'
                ? 'bg-blue-500 text-white'
                : 'bg-black/30 text-white/70 hover:bg-black/50'
            }`}
          >
            CACHED
          </button>
        </div>
      </div>
    </div>
  );
};
