import { Search, Wifi, WifiOff } from 'lucide-react';

export default function KitchenTopBar({ searchQuery, onSearchChange, filterType, onFilterChange, isConnected }) {
  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-6 shadow-sm">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl font-bold">🍔</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Kitchen Display</h1>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search menu items..."
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onFilterChange('dine-in')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'dine-in'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Dine-in
        </button>
        <button
          onClick={() => onFilterChange('take-out')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterType === 'take-out'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Take Out
        </button>
      </div>

      {/* Connection Status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
}
