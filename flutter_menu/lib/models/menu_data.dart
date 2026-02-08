class MenuItem {
  final String name;
  final double price;
  final String description;
  final List<String>? modifiers;
  final List<String>? sizes;
  final Map<String, double>? sizePrices;
  final List<String>? flavors;

  MenuItem({
    required this.name,
    required this.price,
    required this.description,
    this.modifiers,
    this.sizes,
    this.sizePrices,
    this.flavors,
  });
}

class MenuData {
  static final Map<String, List<MenuItem>> burgers = {
    'Burgers': [
      MenuItem(
        name: 'Classic Burger',
        price: 7.99,
        description: 'Beef patty, lettuce, tomato, onion, pickles, Burger Express sauce',
        modifiers: ['no pickles', 'no onions', 'extra cheese', 'no lettuce', 'add bacon', 'add avocado', 'add fried egg'],
      ),
      MenuItem(
        name: 'Cheese Burger',
        price: 8.99,
        description: 'Classic Burger + American cheese',
        modifiers: ['no pickles', 'no onions', 'extra cheese', 'no lettuce', 'add bacon', 'add avocado', 'add fried egg'],
      ),
      MenuItem(
        name: 'Double Cheese Burger',
        price: 11.49,
        description: 'Two beef patties, double American cheese, lettuce, tomato, pickles, Burger Express sauce',
        modifiers: ['no pickles', 'no onions', 'extra cheese', 'no lettuce', 'add bacon'],
      ),
      MenuItem(
        name: 'Bacon BBQ Burger',
        price: 10.99,
        description: 'Beef patty, crispy bacon, cheddar cheese, BBQ sauce, onion rings, lettuce',
        modifiers: ['no onions', 'extra bacon', 'extra cheese', 'no lettuce'],
      ),
      MenuItem(
        name: 'Spicy Jalapeño Burger',
        price: 10.49,
        description: 'Beef patty, pepper jack cheese, jalapeños, chipotle mayo, lettuce, tomato',
        modifiers: ['no jalapeños', 'extra jalapeños', 'no cheese', 'add bacon'],
      ),
      MenuItem(
        name: 'Mushroom Swiss Burger',
        price: 10.49,
        description: 'Beef patty, sautéed mushrooms, Swiss cheese, garlic aioli, lettuce',
        modifiers: ['extra mushrooms', 'no mushrooms', 'extra cheese', 'add bacon'],
      ),
      MenuItem(
        name: 'Veggie Burger',
        price: 9.49,
        description: 'Plant-based patty, lettuce, tomato, onion, pickles, Burger Express sauce',
        modifiers: ['no pickles', 'no onions', 'add avocado', 'add cheese'],
      ),
    ],
  };

  static final Map<String, List<MenuItem>> chicken = {
    'Chicken': [
      MenuItem(
        name: 'Crispy Chicken Sandwich',
        price: 9.49,
        description: 'Fried chicken breast, pickles, mayo, brioche bun',
        modifiers: ['no pickles', 'no mayo', 'add cheese', 'add bacon'],
      ),
      MenuItem(
        name: 'Grilled Chicken Sandwich',
        price: 9.49,
        description: 'Grilled chicken breast, lettuce, tomato, honey mustard, brioche bun',
        modifiers: ['no mustard', 'add cheese', 'add bacon', 'add avocado'],
      ),
      MenuItem(
        name: 'Spicy Chicken Sandwich',
        price: 9.99,
        description: 'Fried chicken breast, spicy slaw, pepper jack cheese, chipotle mayo',
        modifiers: ['no slaw', 'no cheese', 'extra spicy', 'add bacon'],
      ),
    ],
  };

  static final Map<String, List<MenuItem>> sides = {
    'Sides': [
      MenuItem(
        name: 'Regular Fries',
        price: 3.49,
        description: 'Classic golden fries',
      ),
      MenuItem(
        name: 'Cheese Fries',
        price: 4.99,
        description: 'Fries topped with melted cheese',
      ),
      MenuItem(
        name: 'Onion Rings',
        price: 4.49,
        description: 'Crispy battered onion rings',
      ),
      MenuItem(
        name: 'Side Salad',
        price: 3.99,
        description: 'Fresh mixed greens with choice of dressing',
      ),
      MenuItem(
        name: 'Mac & Cheese',
        price: 4.49,
        description: 'Creamy macaroni and cheese',
      ),
    ],
  };

  static final Map<String, List<MenuItem>> drinks = {
    'Drinks': [
      MenuItem(
        name: 'Fountain Drink',
        price: 1.99,
        description: 'Coke, Sprite, Dr Pepper, Lemonade',
        sizes: ['small', 'medium', 'large'],
        sizePrices: {'small': 1.99, 'medium': 2.49, 'large': 2.99},
      ),
      MenuItem(
        name: 'Milkshake',
        price: 5.99,
        description: 'Hand-spun milkshake',
        flavors: ['Vanilla', 'Chocolate', 'Strawberry'],
      ),
      MenuItem(
        name: 'Bottled Water',
        price: 1.49,
        description: 'Refreshing bottled water',
      ),
      MenuItem(
        name: 'Iced Tea',
        price: 2.49,
        description: 'Sweet or Unsweet',
      ),
    ],
  };

  static final Map<String, String> combos = {
    'description': 'Any burger or chicken sandwich can be made a combo for +\$4.49 (includes Regular Fries + Medium Fountain Drink)',
    'upgrade_cheese_fries_or_onion_rings': '+\$1.50',
    'upgrade_large_drink': '+\$0.50',
  };

  static final Map<String, double> extras = {
    'Extra patty': 3.00,
    'Add bacon': 1.50,
    'Add avocado': 1.50,
    'Add fried egg': 1.00,
    'Extra cheese': 0.75,
    'Gluten-free bun': 1.00,
  };

  static final List<Map<String, String>> promotions = [
    {
      'name': 'Combo Deal',
      'description': 'Get any two combos for \$24.99 (saves up to \$5)',
    },
    {
      'name': 'Free Milkshake Friday',
      'description': 'Free milkshake with any combo purchase on Friday',
    },
  ];
}
