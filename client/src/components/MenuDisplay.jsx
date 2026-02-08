// =============================================================================
// client/src/components/MenuDisplay.jsx — Compact Menu Display (No Scroll)
// =============================================================================

import { motion } from 'framer-motion';
import { UtensilsCrossed, Coffee, Salad } from 'lucide-react';

export default function MenuDisplay({ menu }) {
  if (!menu) return null;

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-white" />
          </div>
          Menu
        </h2>
      </div>

      {/* Compact Menu Grid - No Scroll */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="grid grid-cols-3 gap-3 h-full">
          {/* Column 1: Burgers */}
          <div className="space-y-2">
            {menu.burgers && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-gray-900 font-bold text-sm mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4" />
                  BURGERS
                </h3>
                <div className="space-y-2">
                  {Object.entries(menu.burgers).map(([name, item]) => (
                    <div key={name} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold pr-2">{name}</span>
                        <span className="text-gray-900 font-bold whitespace-nowrap">${item.price.toFixed(2)}</span>
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-[9px] leading-tight mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chicken */}
            {menu.chicken && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-gray-900 font-bold text-sm mb-2">CHICKEN</h3>
                <div className="space-y-2">
                  {Object.entries(menu.chicken).map(([name, item]) => (
                    <div key={name} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold pr-2">{name}</span>
                        <span className="text-gray-900 font-bold whitespace-nowrap">${item.price.toFixed(2)}</span>
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-[9px] leading-tight mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Sides & Drinks */}
          <div className="space-y-2">
            {/* Sides */}
            {menu.sides && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-gray-900 font-bold text-sm mb-2 flex items-center gap-1.5">
                  <Salad className="w-4 h-4" />
                  SIDES
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(menu.sides).map(([name, item]) => (
                    <div key={name} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold pr-2">{name}</span>
                        <span className="text-gray-900 font-bold whitespace-nowrap">${item.price.toFixed(2)}</span>
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-[9px] leading-tight mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drinks */}
            {menu.drinks && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-gray-900 font-bold text-sm mb-2 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" />
                  DRINKS
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(menu.drinks).map(([name, item]) => (
                    <div key={name} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-900 font-semibold pr-2">{name}</span>
                        {item.size_prices ? (
                          <span className="text-gray-900 font-bold whitespace-nowrap text-[10px]">
                            ${item.size_prices.small.toFixed(2)}-${item.size_prices.large.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-900 font-bold whitespace-nowrap">${item.price.toFixed(2)}</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-[9px] leading-tight mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Combos & Extras */}
          <div className="space-y-2">
            {/* Combos */}
            {menu.combos && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <h3 className="text-green-800 font-bold text-sm mb-1.5">COMBOS</h3>
                <p className="text-green-700 text-[10px] leading-snug mb-2">{menu.combos.description}</p>
                {menu.combos.upgrade_options && (
                  <div className="space-y-1 text-[10px]">
                    {Object.entries(menu.combos.upgrade_options).map(([upgrade, price]) => (
                      <div key={upgrade} className="flex justify-between">
                        <span className="text-gray-700 truncate pr-1 capitalize">{upgrade.replace(/_/g, ' ')}</span>
                        <span className="text-green-700 font-bold whitespace-nowrap">+${price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Extras */}
            {menu.extras && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h3 className="text-gray-900 font-bold text-sm mb-2">EXTRAS</h3>
                <div className="space-y-1">
                  {Object.entries(menu.extras).map(([name, price]) => (
                    <div key={name} className="flex justify-between text-xs">
                      <span className="text-gray-700 truncate pr-1">{name}</span>
                      <span className="text-gray-900 font-bold whitespace-nowrap">+${price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
