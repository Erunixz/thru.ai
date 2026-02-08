// =============================================================================
// client/src/components/MenuDisplay.jsx — Full Menu Display
// =============================================================================

import { motion } from 'framer-motion';
import { UtensilsCrossed, Coffee, Salad, IceCream, Sparkles } from 'lucide-react';

export default function MenuDisplay({ menu }) {
  if (!menu) return null;

  return (
    <div className="h-full overflow-hidden bg-slate-800/30 rounded-2xl border border-slate-700/50">
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-brand-400" />
          Menu
        </h2>
      </div>

      {/* Menu Grid - 2 columns, compact */}
      <div className="grid grid-cols-2 gap-4 p-6 h-[calc(100%-4rem)]">
        {/* Column 1: Burgers & Chicken */}
        <div className="space-y-4 overflow-hidden">
          {/* Burgers */}
          {menu.burgers && (
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
              <h3 className="text-brand-400 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4" />
                BURGERS
              </h3>
              <div className="space-y-1.5">
                {Object.entries(menu.burgers).map(([name, item]) => (
                  <div key={name} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white font-medium">{name}</span>
                      <span className="text-brand-400 font-semibold">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-500 text-[10px] leading-tight">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chicken */}
          {menu.chicken && (
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
              <h3 className="text-amber-400 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4" />
                CHICKEN
              </h3>
              <div className="space-y-1.5">
                {Object.entries(menu.chicken).map(([name, item]) => (
                  <div key={name} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white font-medium">{name}</span>
                      <span className="text-amber-400 font-semibold">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-slate-500 text-[10px] leading-tight">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Sides, Drinks & More */}
        <div className="space-y-4 overflow-hidden">
          {/* Sides */}
          {menu.sides && (
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
              <h3 className="text-yellow-400 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Salad className="w-4 h-4" />
                SIDES
              </h3>
              <div className="space-y-1.5">
                {Object.entries(menu.sides).map(([name, item]) => (
                  <div key={name} className="text-xs flex justify-between items-baseline">
                    <span className="text-white font-medium">{name}</span>
                    <span className="text-yellow-400 font-semibold">${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drinks */}
          {menu.drinks && (
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
              <h3 className="text-blue-400 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Coffee className="w-4 h-4" />
                DRINKS
              </h3>
              <div className="space-y-1.5">
                {Object.entries(menu.drinks).map(([name, item]) => (
                  <div key={name} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white font-medium">{name}</span>
                      {item.size_prices ? (
                        <span className="text-blue-400 font-semibold text-[10px]">
                          ${item.size_prices.small.toFixed(2)} - ${item.size_prices.large.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-blue-400 font-semibold">${item.price.toFixed(2)}</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-slate-500 text-[10px]">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combos */}
          {menu.combos && (
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-xl p-3 border border-green-600/30">
              <h3 className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                COMBOS
              </h3>
              <div className="text-xs">
                {menu.combos.description && (
                  <p className="text-green-300 mb-1.5 text-[11px]">{menu.combos.description}</p>
                )}
                {menu.combos.upgrade_options && (
                  <div className="space-y-0.5">
                    <p className="text-slate-400 text-[10px]">Upgrades:</p>
                    {Object.entries(menu.combos.upgrade_options).map(([upgrade, price]) => (
                      <div key={upgrade} className="flex justify-between text-[10px]">
                        <span className="text-slate-300 capitalize">{upgrade.replace(/_/g, ' ')}</span>
                        <span className="text-green-400">+${price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Extras */}
          {menu.extras && (
            <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
              <h3 className="text-purple-400 font-semibold text-sm mb-2">EXTRAS</h3>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                {Object.entries(menu.extras).map(([name, price]) => (
                  <div key={name} className="flex justify-between">
                    <span className="text-slate-300">{name}</span>
                    <span className="text-purple-400">+${price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
