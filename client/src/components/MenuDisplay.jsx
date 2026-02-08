import { useMemo } from 'react';

export default function MenuDisplay({ menuItems }) {
  // Gradient colors for categories
  const gradientColors = {
    burgers: 'from-orange-400 to-orange-600',
    sides: 'from-yellow-400 to-yellow-600',
    drinks: 'from-blue-400 to-blue-600',
    combos: 'from-red-400 to-red-600',
    desserts: 'from-pink-400 to-pink-600',
  };

  if (menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden p-4 bg-slate-900/50">
      {/* Static Grid - No Scrolling, Fits All Items */}
      <div className="grid grid-cols-4 gap-2 h-full">
        {menuItems.map(item => {
          const gradient = gradientColors[item.category] || 'from-slate-400 to-slate-600';

          return (
            <div key={item.id} className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 flex flex-col">
              {/* Compact Image */}
              <div className={`w-full h-16 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                <span className="text-white text-xs font-bold drop-shadow-lg text-center px-1">
                  {item.name}
                </span>
                {/* Category badge */}
                <span className="absolute top-1 left-1 text-[8px] bg-black/30 text-white px-1 rounded capitalize">
                  {item.category}
                </span>
              </div>

              {/* Price */}
              <div className="p-1.5 text-center bg-slate-800/80">
                <span className="text-brand-400 font-bold text-sm">${item.price.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
