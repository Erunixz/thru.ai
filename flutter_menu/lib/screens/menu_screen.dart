import 'package:flutter/material.dart';
import '../models/menu_data.dart';
import '../widgets/menu_item_card.dart';
import '../widgets/promotion_card.dart';

class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          '🍔 Burger Express',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Promotions Section
          _buildSectionHeader('🎉 Special Promotions'),
          ...MenuData.promotions.map((promo) => PromotionCard(
                name: promo['name']!,
                description: promo['description']!,
              )),
          const SizedBox(height: 24),

          // Burgers Section
          _buildSectionHeader('🍔 Burgers'),
          ...MenuData.burgers['Burgers']!.map((item) => MenuItemCard(item: item)),
          const SizedBox(height: 24),

          // Chicken Section
          _buildSectionHeader('🍗 Chicken Sandwiches'),
          ...MenuData.chicken['Chicken']!.map((item) => MenuItemCard(item: item)),
          const SizedBox(height: 24),

          // Sides Section
          _buildSectionHeader('🍟 Sides'),
          ...MenuData.sides['Sides']!.map((item) => MenuItemCard(item: item)),
          const SizedBox(height: 24),

          // Drinks Section
          _buildSectionHeader('🥤 Drinks'),
          ...MenuData.drinks['Drinks']!.map((item) => MenuItemCard(item: item)),
          const SizedBox(height: 24),

          // Combos Section
          _buildSectionHeader('💰 Combo Deals'),
          _buildComboInfo(),
          const SizedBox(height: 24),

          // Extras Section
          _buildSectionHeader('➕ Extras & Add-ons'),
          _buildExtrasInfo(),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildComboInfo() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [Colors.orange.shade50, Colors.orange.shade100],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.orange,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '+\$4.49',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Make it a Combo!',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              MenuData.combos['description']!,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 8),
            const Text(
              'Upgrade Options:',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            _buildUpgradeOption('🧀 Cheese Fries or Onion Rings', MenuData.combos['upgrade_cheese_fries_or_onion_rings']!),
            _buildUpgradeOption('🥤 Large Drink', MenuData.combos['upgrade_large_drink']!),
          ],
        ),
      ),
    );
  }

  Widget _buildUpgradeOption(String name, String price) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          const Icon(Icons.arrow_right, color: Colors.orange, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              name,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[800],
              ),
            ),
          ),
          Text(
            price,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExtrasInfo() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: MenuData.extras.entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  const Icon(Icons.add_circle_outline, color: Colors.orange, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      entry.key,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Text(
                    '\$${entry.value.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
