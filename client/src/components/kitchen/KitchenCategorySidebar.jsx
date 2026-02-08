import { Flame, Beef, Utensils, Coffee, Cake, Grid3x3 } from 'lucide-react';

// Category icon mapping
const categoryIcons = {
  burgers: Beef,
  sides: Utensils,
  drinks: Coffee,
  combos: Flame,
  desserts: Cake,
  all: Grid3x3,
};

export default function KitchenCategorySidebar({ categories, activeCategory, onCategoryClick }) {
  return (
    <div className="w-64 bg-slate-800 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-white font-bold text-lg">Categories</h3>
      </div>

      <nav className="flex-1 p-2">
        {/* All Items */}
        <button
          onClick={() => onCategoryClick('all')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
            activeCategory === 'all'
              ? 'bg-orange-500 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Grid3x3 size={20} />
          <span className="flex-1 text-left font-medium">All Items</span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            activeCategory === 'all' ? 'bg-white text-orange-500' : 'bg-slate-700 text-slate-300'
          }`}>
            {categories.reduce((sum, cat) => sum + cat.count, 0)}
          </span>
        </button>

        {/* Category List */}
        {categories.map(({ name, count }) => {
          const Icon = categoryIcons[name] || Grid3x3;
          const isActive = activeCategory === name;

          return (
            <button
              key={name}
              onClick={() => onCategoryClick(name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="flex-1 text-left font-medium capitalize">{name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                isActive ? 'bg-white text-orange-500' : 'bg-slate-700 text-slate-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
