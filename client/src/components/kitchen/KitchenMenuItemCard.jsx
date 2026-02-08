import { motion } from 'framer-motion';

export default function KitchenMenuItemCard({ item }) {
  // Use gradient placeholder for images
  const gradientColors = {
    burgers: 'from-orange-400 to-orange-600',
    sides: 'from-yellow-400 to-yellow-600',
    drinks: 'from-blue-400 to-blue-600',
    combos: 'from-red-400 to-red-600',
    desserts: 'from-pink-400 to-pink-600',
  };

  const gradient = gradientColors[item.category] || 'from-slate-400 to-slate-600';

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Placeholder */}
      <div className={`w-full h-48 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <span className="text-white text-xl font-bold drop-shadow-lg">
          {item.name}
        </span>
        {item.popular && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Popular
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-lg font-bold">Sold Out</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-slate-900 mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{item.description}</p>
        )}

        {/* Additional Info */}
        {item.sizes && (
          <p className="text-xs text-slate-500 mb-2">
            Available in: {item.sizes.join(', ')}
          </p>
        )}
        {item.flavors && (
          <p className="text-xs text-slate-500 mb-2">
            Flavors: {item.flavors.join(', ')}
          </p>
        )}
        {item.includes && (
          <p className="text-xs text-slate-500 mb-2">
            Includes: {item.includes.join(', ')}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-orange-500 font-bold text-xl">
            ${item.price.toFixed(2)}
          </span>
          <button
            className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
            aria-label="Quick reference"
          >
            +
          </button>
        </div>
      </div>
    </motion.div>
  );
}
