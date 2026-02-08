// =============================================================================
// server/utils/menuFormatter.js — Format menu.json for ElevenLabs Agent
// =============================================================================
//
// Converts the JSON menu structure into a natural, conversational format
// that the AI agent can easily understand and use when taking orders.
//
// =============================================================================

/**
 * Format menu data into a natural language format for the AI agent
 * @param {Object} menuData - The parsed menu.json object
 * @returns {string} - Formatted menu text for the system prompt
 */
function formatMenuForAgent(menuData) {
  let formattedText = '';

  // Format Burgers Section
  if (menuData.burgers && Object.keys(menuData.burgers).length > 0) {
    formattedText += '=== BURGERS ===\n\n';

    Object.entries(menuData.burgers).forEach(([name, details], index) => {
      formattedText += `${index + 1}. ${name} - $${details.price.toFixed(2)}\n`;
      formattedText += `   ${details.description}\n`;

      if (details.modifiers && details.modifiers.length > 0) {
        formattedText += `   Available modifiers: ${details.modifiers.join(', ')}\n`;
      }

      formattedText += '\n';
    });
  }

  // Format Chicken Section
  if (menuData.chicken && Object.keys(menuData.chicken).length > 0) {
    formattedText += '=== CHICKEN SANDWICHES ===\n\n';

    Object.entries(menuData.chicken).forEach(([name, details], index) => {
      formattedText += `${index + 1}. ${name} - $${details.price.toFixed(2)}\n`;
      formattedText += `   ${details.description}\n`;

      if (details.modifiers && details.modifiers.length > 0) {
        formattedText += `   Available modifiers: ${details.modifiers.join(', ')}\n`;
      }

      formattedText += '\n';
    });
  }

  // Format Sides Section
  if (menuData.sides && Object.keys(menuData.sides).length > 0) {
    formattedText += '=== SIDES ===\n\n';

    Object.entries(menuData.sides).forEach(([name, details], index) => {
      formattedText += `${index + 1}. ${name} - $${details.price.toFixed(2)}\n`;

      if (details.description) {
        formattedText += `   ${details.description}\n`;
      }

      formattedText += '\n';
    });
  }

  // Format Drinks Section
  if (menuData.drinks && Object.keys(menuData.drinks).length > 0) {
    formattedText += '=== DRINKS ===\n\n';

    Object.entries(menuData.drinks).forEach(([name, details], index) => {
      if (details.sizes && details.size_prices) {
        // Drink with sizes
        formattedText += `${index + 1}. ${name} - Sizes available:\n`;
        Object.entries(details.size_prices).forEach(([size, price]) => {
          formattedText += `   ${size.charAt(0).toUpperCase() + size.slice(1)}: $${price.toFixed(2)}\n`;
        });
      } else {
        // Single-price drink
        formattedText += `${index + 1}. ${name} - $${details.price.toFixed(2)}\n`;
      }

      if (details.description) {
        formattedText += `   ${details.description}\n`;
      }

      if (details.flavors && details.flavors.length > 0) {
        formattedText += `   Flavors: ${details.flavors.join(', ')}\n`;
      }

      formattedText += '\n';
    });
  }

  // Format Combos Section
  if (menuData.combos) {
    formattedText += '=== COMBO MEALS ===\n\n';

    if (menuData.combos.description) {
      formattedText += `${menuData.combos.description}\n\n`;
    }

    if (menuData.combos.upgrade_options) {
      formattedText += 'Combo Upgrade Options:\n';
      Object.entries(menuData.combos.upgrade_options).forEach(([upgrade, price]) => {
        const upgradeName = upgrade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        formattedText += `- ${upgradeName}: +$${price.toFixed(2)}\n`;
      });
      formattedText += '\n';
    }
  }

  // Format Extras Section
  if (menuData.extras && Object.keys(menuData.extras).length > 0) {
    formattedText += '=== EXTRAS & ADD-ONS ===\n\n';

    Object.entries(menuData.extras).forEach(([name, price]) => {
      formattedText += `- ${name}: +$${price.toFixed(2)}\n`;
    });

    formattedText += '\n';
  }

  // Format Promotions Section
  if (menuData.promotions && menuData.promotions.length > 0) {
    formattedText += '=== CURRENT PROMOTIONS ===\n\n';

    menuData.promotions.forEach((promo, index) => {
      formattedText += `${index + 1}. ${promo.name}\n`;
      formattedText += `   ${promo.description}\n\n`;
    });
  }

  return formattedText.trim();
}

module.exports = { formatMenuForAgent };
