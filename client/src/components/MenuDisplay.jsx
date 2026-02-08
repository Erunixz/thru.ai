// =============================================================================
// client/src/components/MenuDisplay.jsx — Full Menu Display
// =============================================================================

import { motion } from 'framer-motion';
import { UtensilsCrossed, Coffee, Salad, IceCream, Sparkles } from 'lucide-react';

export default function MenuDisplay({ menu }) {
  if (!menu) return null;

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          Menu
        </h2>
      </div>

      {/* Menu Grid - 2 columns with scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 p-6">
          {/* Column 1: Burgers & Chicken */}
          <div className="space-y-4">
            {/* Burgers */}
            {menu.burgers && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4 text-gray-700" />
                  </div>
                  BURGERS
                </h3>
                <div className="space-y-2.5">
                  {Object.entries(menu.burgers).map(([name, item]) => (
                    <div key={name} className="text-xs bg-white rounded-lg p-2.5 border border-gray-100 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-gray-900 font-semibold text-sm">{name}</span>
                        <span className="text-gray-900 font-bold">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-500 text-xs leading-tight">{item.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chicken */}
            {menu.chicken && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4 text-gray-700" />
                  </div>
                  CHICKEN
                </h3>
                <div className="space-y-2.5">
                  {Object.entries(menu.chicken).map(([name, item]) => (
                    <div key={name} className="text-xs bg-white rounded-lg p-2.5 border border-gray-100 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-gray-900 font-semibold text-sm">{name}</span>
                        <span className="text-gray-900 font-bold">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-gray-500 text-xs leading-tight">{item.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Column 2: Sides, Drinks & More */}
          <div className="space-y-4">
            {/* Sides */}
            {menu.sides && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Salad className="w-4 h-4 text-gray-700" />
                  </div>
                  SIDES
                </h3>
                <div className="space-y-2">
                  {Object.entries(menu.sides).map(([name, item]) => (
                    <div key={name} className="text-xs flex justify-between items-baseline bg-white rounded-lg p-2 border border-gray-100 hover:border-gray-300 transition-colors">
                      <span className="text-gray-900 font-semibold">{name}</span>
                      <span className="text-gray-900 font-bold">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Drinks */}
            {menu.drinks && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-gray-700" />
                  </div>
                  DRINKS
                </h3>
                <div className="space-y-2">
                  {Object.entries(menu.drinks).map(([name, item]) => (
                    <div key={name} className="text-xs bg-white rounded-lg p-2 border border-gray-100 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-baseline">
                        <span className="text-gray-900 font-semibold">{name}</span>
                        {item.size_prices ? (
                          <span className="text-gray-900 font-bold text-[11px]">
                            ${item.size_prices.small.toFixed(2)} - ${item.size_prices.large.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-900 font-bold">${item.price.toFixed(2)}</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Combos */}
            {menu.combos && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-green-50 rounded-xl p-4 border border-green-200"
              >
                <h3 className="text-green-800 font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-green-700" />
                  </div>
                  COMBOS
                </h3>
                <div className="text-xs bg-white rounded-lg p-2.5 border border-green-100">
                  {menu.combos.description && (
                    <p className="text-green-800 mb-2 text-xs font-medium">{menu.combos.description}</p>
                  )}
                  {menu.combos.upgrade_options && (
                    <div className="space-y-1">
                      <p className="text-gray-600 text-[10px] font-semibold mb-1.5">Upgrades:</p>
                      {Object.entries(menu.combos.upgrade_options).map(([upgrade, price]) => (
                        <div key={upgrade} className="flex justify-between text-xs">
                          <span className="text-gray-700 capitalize">{upgrade.replace(/_/g, ' ')}</span>
                          <span className="text-green-700 font-bold">+${price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Extras */}
            {menu.extras && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <h3 className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                    <IceCream className="w-4 h-4 text-gray-700" />
                  </div>
                  EXTRAS
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(menu.extras).map(([name, price]) => (
                    <div key={name} className="flex justify-between bg-white rounded-lg p-2 border border-gray-100 hover:border-gray-300 transition-colors">
                      <span className="text-gray-900 font-semibold">{name}</span>
                      <span className="text-gray-700 font-bold">+${price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
