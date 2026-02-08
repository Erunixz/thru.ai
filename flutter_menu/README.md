# Burger Express Flutter Menu App

A beautiful Flutter app displaying the complete Burger Express menu from your thru.ai drive-through ordering system.

## Features

- **Complete Menu Display**: Shows all items from menu.json including:
  - 🍔 Burgers (7 varieties)
  - 🍗 Chicken Sandwiches (3 varieties)
  - 🍟 Sides (5 options)
  - 🥤 Drinks (4 options)
  - 💰 Combo Deals
  - ➕ Extras & Add-ons
  - 🎉 Special Promotions

- **Detailed Item Information**:
  - Item names and descriptions
  - Prices displayed prominently
  - Available sizes and size-specific pricing
  - Flavor options for items like milkshakes
  - Customization/modifier options
  - Visual promotion cards

## Getting Started

### Prerequisites

- Flutter SDK installed (version 3.0.0 or higher)
- Android Studio / VS Code with Flutter extensions
- An emulator or physical device

### Installation

1. Navigate to the flutter_menu directory:
   ```bash
   cd flutter_menu
   ```

2. Get dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

## Project Structure

```
flutter_menu/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── models/
│   │   └── menu_data.dart          # Menu data structure from menu.json
│   ├── screens/
│   │   └── menu_screen.dart        # Main menu display screen
│   └── widgets/
│       ├── menu_item_card.dart     # Individual menu item widget
│       └── promotion_card.dart     # Promotion display widget
└── pubspec.yaml                     # Flutter dependencies
```

## Menu Data

All menu items are statically defined in `lib/models/menu_data.dart` based on your `menu.json` file. The data includes:

- **Burgers**: Classic Burger, Cheese Burger, Double Cheese Burger, Bacon BBQ Burger, Spicy Jalapeño Burger, Mushroom Swiss Burger, Veggie Burger
- **Chicken**: Crispy Chicken Sandwich, Grilled Chicken Sandwich, Spicy Chicken Sandwich
- **Sides**: Regular Fries, Cheese Fries, Onion Rings, Side Salad, Mac & Cheese
- **Drinks**: Fountain Drink (with size options), Milkshake (with flavors), Bottled Water, Iced Tea
- **Combos**: Combo upgrade options and pricing
- **Extras**: Extra patty, bacon, avocado, fried egg, cheese, gluten-free bun
- **Promotions**: Combo Deal, Free Milkshake Friday

## Screenshots

The app features:
- Clean, modern UI with Material Design 3
- Orange/red color scheme matching the Burger Express brand
- Card-based layout for easy scanning
- Gradient promotional banners
- Chip-based size/flavor selectors
- Organized sections with clear headers

## Customization

To update the menu items:
1. Edit `lib/models/menu_data.dart`
2. Follow the existing `MenuItem` structure
3. Run `flutter run` to see changes

## License

Part of the thru.ai Drive-Through AI Ordering System
