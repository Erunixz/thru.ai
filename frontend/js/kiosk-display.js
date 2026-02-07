// Kiosk Display Controller
// This display shows orders as they're built by the AI voice system

let currentOrder = null;
let lastOrderStatus = null;
let pollInterval = null;

// Configuration
const POLL_INTERVAL = 1000; // Poll every 1 second for real-time updates
const COMPLETION_DISPLAY_TIME = 5000; // Show completion for 5 seconds
const API_BASE_URL = 'http://localhost:3001';

// Initialize display
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖥️ Kiosk Display Initialized');
    console.log('Resolution: 1080x1920 (Portrait)');
    showWelcomeScreen();
    startPolling();
});

// Start polling for orders
function startPolling() {
    console.log('📡 Starting order polling...');
    pollInterval = setInterval(checkForOrders, POLL_INTERVAL);
}

// Check backend for new orders
async function checkForOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/latest`);

        if (!response.ok) {
            // No orders yet - stay on welcome screen
            if (currentOrder !== null) {
                resetToWelcome();
            }
            return;
        }

        const orderData = await response.json();

        // Update display with order data
        updateDisplay(orderData);

    } catch (error) {
        console.log('⏳ Waiting for backend connection...');
        // Stay on welcome screen if backend not available
    }
}

// Update the display with order data
function updateDisplay(orderData) {
    // Check if this is a new order or update to existing
    const isNewOrder = currentOrder === null ||
                       JSON.stringify(currentOrder) !== JSON.stringify(orderData);

    currentOrder = orderData;

    // Handle order status changes
    if (orderData.status === 'complete' && lastOrderStatus !== 'complete') {
        showCompletionScreen();
        lastOrderStatus = 'complete';

        // Reset to welcome after display time
        setTimeout(() => {
            resetToWelcome();
        }, COMPLETION_DISPLAY_TIME);
        return;
    }

    lastOrderStatus = orderData.status;

    // Show order screen if items exist
    if (orderData.items && orderData.items.length > 0) {
        showOrderScreen(orderData);
    } else {
        showWelcomeScreen();
    }
}

// Show welcome screen
function showWelcomeScreen() {
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.getElementById('orderScreen').classList.remove('active');
    document.getElementById('completionOverlay').classList.remove('active');
    document.getElementById('statusText').textContent = 'Ready';
    document.getElementById('statusText').style.color = 'white';
}

// Show order screen with items
function showOrderScreen(orderData) {
    // Hide welcome, show order
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('orderScreen').classList.add('active');
    document.getElementById('completionOverlay').classList.remove('active');

    // Update status
    document.getElementById('statusText').textContent = 'Taking Order';
    document.getElementById('statusText').style.color = '#FFC72C';

    // Update AI status message
    const aiStatus = document.getElementById('aiStatus');
    if (orderData.status === 'in_progress') {
        aiStatus.textContent = 'Listening to your order...';
        aiStatus.style.color = '#27AE60';
    } else {
        aiStatus.textContent = 'Processing...';
        aiStatus.style.color = '#FFC72C';
    }

    // Render order items
    renderOrderItems(orderData.items);

    // Update summary
    updateOrderSummary(orderData);
}

// Render order items
function renderOrderItems(items) {
    const orderItemsDiv = document.getElementById('orderItems');

    if (!items || items.length === 0) {
        orderItemsDiv.innerHTML = `
            <div class="empty-order">
                <div class="empty-icon">🎤</div>
                <div>Waiting for your order...</div>
            </div>
        `;
        return;
    }

    orderItemsDiv.innerHTML = '';

    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';

        // Format item details
        const quantity = item.quantity || 1;
        const sizeText = item.size ? ` (${capitalizeFirst(item.size)})` : '';
        const modifiers = item.modifiers && item.modifiers.length > 0
            ? `<div class="item-details">📝 ${item.modifiers.join(', ')}</div>`
            : '';

        const itemTotal = (item.price * quantity).toFixed(2);

        itemDiv.innerHTML = `
            <div class="item-header">
                <div class="item-name">${item.name}${sizeText}</div>
                <div class="item-quantity">×${quantity}</div>
            </div>
            ${modifiers}
            <div class="item-price">$${itemTotal}</div>
        `;

        orderItemsDiv.appendChild(itemDiv);
    });
}

// Update order summary
function updateOrderSummary(orderData) {
    const summaryDiv = document.getElementById('orderSummary');

    if (!orderData.items || orderData.items.length === 0) {
        summaryDiv.style.display = 'none';
        return;
    }

    summaryDiv.style.display = 'block';

    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    // Update display
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Show completion screen
function showCompletionScreen() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('orderScreen').classList.remove('active');
    document.getElementById('completionOverlay').classList.add('active');
    document.getElementById('statusText').textContent = 'Complete';
    document.getElementById('statusText').style.color = '#27AE60';

    console.log('✅ Order Complete!');
}

// Reset to welcome screen
function resetToWelcome() {
    currentOrder = null;
    lastOrderStatus = null;
    showWelcomeScreen();
    console.log('🔄 Reset to welcome screen');
}

// Utility: Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Handle window visibility changes (screen wake/sleep)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('📺 Display sleep');
    } else {
        console.log('📺 Display wake');
        // Force refresh on wake
        checkForOrders();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
});

// Log status every 30 seconds
setInterval(() => {
    const status = currentOrder ? 'Displaying order' : 'Idle (welcome screen)';
    console.log(`📊 Status: ${status}`);
}, 30000);
