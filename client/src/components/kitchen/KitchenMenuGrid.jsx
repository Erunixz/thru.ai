import { useMemo, useRef, useEffect } from 'react';
import KitchenMenuItemCard from './KitchenMenuItemCard';

export default function KitchenMenuGrid({ menuItems, searchQuery, activeCategory, onCategoryView }) {
  const categoryRefs = useRef({});

  // Filter menu items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return menuItems;

    const query = searchQuery.toLowerCase();
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [menuItems, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Scroll to category when activeCategory changes
  useEffect(() => {
    if (activeCategory && activeCategory !== 'all' && categoryRefs.current[activeCategory]) {
      categoryRefs.current[activeCategory].scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeCategory]);

  // Set up intersection observer to detect active category
  useEffect(() => {
    if (!onCategoryView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const category = entry.target.dataset.category;
            if (category) {
              onCategoryView(category);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
    );

    Object.values(categoryRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [groupedItems, onCategoryView]);

  const categoryNames = Object.keys(groupedItems);

  if (categoryNames.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No items found</h3>
          <p className="text-slate-500">Try a different search term</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      {categoryNames.map(category => (
        <section
          key={category}
          ref={el => categoryRefs.current[category] = el}
          data-category={category}
          className="mb-8"
        >
          {/* Category Header */}
          <h2 className="text-2xl font-bold text-slate-900 mb-4 capitalize border-b-2 border-orange-500 pb-2 inline-block">
            {category}
          </h2>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {groupedItems[category].map(item => (
              <KitchenMenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
