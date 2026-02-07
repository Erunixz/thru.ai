// Application State
let currentOrder = {
    items: [],
    total: 0.0,
    status: "in_progress"
};

let currentCategory = 'all';
let orderNumber = Math.floor(Math.random() * 9000) + 1000;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Burger Express Kiosk Initialized');
    renderMenu();
    startPollingAIOrders();
});

// Navigation Functions
function startOrder() {
    showScreen('menuScreen');
}

function goBack() {
    showScreen('welcomeScreen');
    resetOrder();
}

function switchToManual() {
    showScreen('menuScreen');
}

function viewCart() {
    // Already on menu screen, just scroll to summary
    document.querySelector('.order-summary').scrollIntoView({ behavior: 'smooth' });
}

function newOrder() {
    showScreen('welcomeScreen');
    resetOrder();
    orderNumber = Math.floor(Math.random() * 9000) + 1000;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Menu Functions
function renderMenu() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    Object.entries(menuData).forEach(([categoryName, items]) => {
        Object.entries(items).forEach(([itemName, itemData]) => {
            if (currentCategory === 'all' || itemData.category === currentCategory) {
                const menuItem = createMenuItem(itemName, itemData);
                menuGrid.appendChild(menuItem);
            }
        });
    });
}

function createMenuItem(name, data) {
    const div = document.createElement('div');
    div.className = 'menu-item';

    const priceDisplay = data.sizes ? `From $${data.price.toFixed(2)}` : `$${data.price.toFixed(2)}`;
    const description = data.description || (data.includes ? data.includes.join(', ') : '');

    div.innerHTML = `
        <div class="item-icon">${data.icon}</div>
        <div class="item-name">${name}</div>
        <div class="item-description">${description}</div>
        <div class="item-price">${priceDisplay}</div>
        <button class="add-button" onclick='addToOrder(${JSON.stringify(name)}, ${JSON.stringify(data)})'>
            Add to Order
        </button>
    `;

    return div;
}

function filterCategory(category) {
    currentCategory = category;

    // Update active tab
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderMenu();
}

// Order Management
function addToOrder(itemName, itemData) {
    // Handle items with sizes
    if (itemData.sizes) {
        const size = prompt(`Choose size for ${itemName}:\n- small ($${itemData.size_prices.small})\n- medium ($${itemData.size_prices.medium})\n- large ($${itemData.size_prices.large})`);

        if (!size || !itemData.sizes.includes(size.toLowerCase())) {
            alert('Invalid size selected');
            return;
        }

        const orderItem = {
            name: itemName,
            quantity: 1,
            price: itemData.size_prices[size.toLowerCase()],
            size: size.toLowerCase(),
            modifiers: []
        };

        currentOrder.items.push(orderItem);
    } else {
        // Regular item without sizes
        const orderItem = {
            name: itemName,
            quantity: 1,
            price: itemData.price,
            modifiers: []
        };

        currentOrder.items.push(orderItem);
    }

    updateOrderDisplay();

    // Visual feedback
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 100px; right: 420px; background: #27AE60; color: white; padding: 15px 30px; border-radius: 10px; font-weight: bold; z-index: 1000;';
    notification.textContent = `✓ ${itemName} added!`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function updateOrderDisplay() {
    const orderItemsDiv = document.getElementById('orderItems');
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (currentOrder.items.length === 0) {
        orderItemsDiv.innerHTML = '<p class="empty-order">No items yet</p>';
        cartCount.textContent = '0';
        checkoutBtn.disabled = true;
        return;
    }

    orderItemsDiv.innerHTML = '';
    let subtotal = 0;

    currentOrder.items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';

        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const sizeText = item.size ? ` (${item.size})` : '';
        const modifiersText = item.modifiers && item.modifiers.length > 0
            ? `<div class="order-item-details">${item.modifiers.join(', ')}</div>`
            : '';

        itemDiv.innerHTML = `
            <div class="order-item-header">
                <div class="order-item-name">${item.name}${sizeText}</div>
                <div class="order-item-price">$${itemTotal.toFixed(2)}</div>
            </div>
            ${modifiersText}
            <div class="order-item-quantity">
                <button class="qty-button" onclick="changeQuantity(${index}, -1)">-</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-button" onclick="changeQuantity(${index}, 1)">+</button>
            </div>
        `;

        orderItemsDiv.appendChild(itemDiv);
    });

    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    currentOrder.total = total;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `$${total.toFixed(2)}`;

    cartCount.textContent = currentOrder.items.length;
    checkoutBtn.disabled = false;
}

function changeQuantity(index, delta) {
    currentOrder.items[index].quantity += delta;

    if (currentOrder.items[index].quantity <= 0) {
        currentOrder.items.splice(index, 1);
    }

    updateOrderDisplay();
}

function resetOrder() {
    currentOrder = {
        items: [],
        total: 0.0,
        status: "in_progress"
    };
    updateOrderDisplay();
}

function checkout() {
    currentOrder.status = "complete";

    // Send order to backend
    fetch('http://localhost:3001/api/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentOrder)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Order sent to backend:', data);
    })
    .catch(error => {
        console.error('Error sending order:', error);
    });

    // Show checkout screen
    displayFinalOrder();
    showScreen('checkoutScreen');
}

function displayFinalOrder() {
    const finalItems = document.getElementById('finalOrderItems');
    finalItems.innerHTML = '';

    currentOrder.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';

        const sizeText = item.size ? ` (${item.size})` : '';
        const itemTotal = item.price * item.quantity;

        itemDiv.innerHTML = `
            <div class="order-item-header">
                <div class="order-item-name">${item.quantity}x ${item.name}${sizeText}</div>
                <div class="order-item-price">$${itemTotal.toFixed(2)}</div>
            </div>
        `;

        finalItems.appendChild(itemDiv);
    });

    document.getElementById('finalTotal').textContent = `$${currentOrder.total.toFixed(2)}`;
    document.getElementById('orderNumber').textContent = orderNumber;
}

// AI Integration - Poll for AI orders
let pollInterval;

function startPollingAIOrders() {
    // Check for AI orders every 2 seconds
    pollInterval = setInterval(() => {
        fetch('http://localhost:3001/api/orders/latest')
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('No orders yet');
            })
            .then(data => {
                updateAIOrderDisplay(data);
            })
            .catch(error => {
                // No orders yet, that's okay
                console.log('Waiting for AI orders...');
            });
    }, 2000);
}

function updateAIOrderDisplay(orderData) {
    // Only update if we're on the AI assistant screen
    const aiScreen = document.getElementById('aiAssistantScreen');
    if (!aiScreen.classList.contains('active')) {
        // Auto-switch to AI screen when order comes in
        showScreen('aiAssistantScreen');
    }

    const aiOrderItems = document.getElementById('aiOrderItems');
    const aiTotal = document.getElementById('aiTotal');
    const aiStatus = document.getElementById('aiStatus');

    if (!orderData.items || orderData.items.length === 0) {
        aiOrderItems.innerHTML = '<p class="empty-order">Waiting for items...</p>';
        aiTotal.textContent = '$0.00';
        aiStatus.textContent = 'Listening...';
        return;
    }

    // Update order items
    aiOrderItems.innerHTML = '';
    orderData.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';

        const sizeText = item.size ? ` (${item.size})` : '';
        const modifiersText = item.modifiers && item.modifiers.length > 0
            ? `<div class="order-item-details">${item.modifiers.join(', ')}</div>`
            : '';

        itemDiv.innerHTML = `
            <div class="order-item-header">
                <div class="order-item-name">${item.quantity || 1}x ${item.name}${sizeText}</div>
                <div class="order-item-price">$${(item.price * (item.quantity || 1)).toFixed(2)}</div>
            </div>
            ${modifiersText}
        `;

        aiOrderItems.appendChild(itemDiv);
    });

    // Update total
    aiTotal.textContent = `$${orderData.total.toFixed(2)}`;

    // Update status
    if (orderData.status === 'complete') {
        aiStatus.textContent = 'Order Complete!';
        aiStatus.style.color = '#27AE60';

        // Auto-checkout after 3 seconds
        setTimeout(() => {
            currentOrder = orderData;
            displayFinalOrder();
            showScreen('checkoutScreen');
        }, 3000);
    } else {
        aiStatus.textContent = 'Processing your order...';
        aiStatus.style.color = '#667eea';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
});
