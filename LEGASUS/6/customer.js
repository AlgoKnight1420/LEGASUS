// Customer Profile JavaScript

// Real customer data and user actions
let customerData = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, City, State 12345'
};

// Load real user data from localStorage
let userActions = {
    productClicks: [],
    orders: [],
    returns: [],
    exchanges: []
};

// Load user actions from localStorage
function loadUserActions() {
    const savedActions = localStorage.getItem('userActions');
    if (savedActions) {
        userActions = JSON.parse(savedActions);
    }
}

// Save user actions to localStorage
function saveUserActions() {
    localStorage.setItem('userActions', JSON.stringify(userActions));
}

// Get orders for current user
function getCurrentUserOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return [];
    
    return userActions.orders.filter(order => order.userId === currentUser.email);
}

// Get returns for current user
function getCurrentUserReturns() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return [];
    
    return userActions.returns.filter(ret => ret.userId === currentUser.email);
}

// Get exchanges for current user
function getCurrentUserExchanges() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return [];
    
    return userActions.exchanges.filter(exc => exc.userId === currentUser.email);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUserActions();
    loadCustomerData();
    loadOrders();
    loadReturns();
    loadExchanges();
    setupEventListeners();
});

function loadCustomerData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || customerData;
    
    const userEmail = currentUser.email || customerData.email;
    const displayName = userEmail.split('@')[0];
    
    document.getElementById('customerName').textContent = `Welcome, ${displayName}!`;
    document.getElementById('customerEmail').textContent = userEmail;
    
    // Update form fields
    document.getElementById('email').value = userEmail;
    document.getElementById('firstName').value = customerData.firstName;
    document.getElementById('lastName').value = customerData.lastName;
    document.getElementById('phone').value = customerData.phone;
    document.getElementById('address').value = customerData.address;
}

function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    const currentOrders = getCurrentUserOrders();
    
    if (currentOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-shopping-bag"></i>
                <h4>No orders yet</h4>
                <p>Start shopping to see your orders here!</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = currentOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-date">${formatDate(order.date)}</div>
                <span class="order-status status-${order.status}">${order.status}</span>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}" class="item-image" data-testid="img-order-item">
                        <div class="item-details">
                            <div class="item-name" data-testid="text-item-name">${item.name}</div>
                            <div class="item-price" data-testid="text-item-price">₹${item.price} | Size: ${item.size}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-total" data-testid="text-order-total">Total: ₹${order.total}</div>
            <div class="order-actions">
                <button class="btn-track" onclick="trackOrder('${order.id}')" data-testid="button-track-${order.id}">
                    <i class="fas fa-truck"></i> Track Order
                </button>
                ${order.status === 'delivered' ? `
                    <button class="btn-return" onclick="requestReturn('${order.id}')" data-testid="button-return-${order.id}">
                        <i class="fas fa-undo"></i> Return
                    </button>
                    <button class="btn-exchange" onclick="requestExchange('${order.id}')" data-testid="button-exchange-${order.id}">
                        <i class="fas fa-exchange-alt"></i> Exchange
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function loadReturns() {
    const returnsList = document.getElementById('returnsList');
    const currentReturns = getCurrentUserReturns();
    
    if (currentReturns.length === 0) {
        returnsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-undo"></i>
                <h4>No returns yet</h4>
                <p>Your return requests will appear here!</p>
            </div>
        `;
        return;
    }

    returnsList.innerHTML = currentReturns.map(ret => `
        <div class="return-exchange-card">
            <div class="return-exchange-header">
                <div class="return-exchange-id" data-testid="text-return-id">Return #${ret.id}</div>
                <div>Order: ${ret.orderId} | ${formatDate(ret.date)}</div>
                <span class="return-exchange-status status-${ret.status}" data-testid="status-return-${ret.id}">${ret.status}</span>
            </div>
            <div class="return-exchange-details">
                <div class="detail-item">
                    <strong>Product:</strong> <span data-testid="text-return-product">${ret.product}</span>
                </div>
                <div class="detail-item">
                    <strong>Reason:</strong> <span data-testid="text-return-reason">${ret.reason}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function loadExchanges() {
    const exchangesList = document.getElementById('exchangesList');
    const currentExchanges = getCurrentUserExchanges();
    
    if (currentExchanges.length === 0) {
        exchangesList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exchange-alt"></i>
                <h4>No exchanges yet</h4>
                <p>Your exchange requests will appear here!</p>
            </div>
        `;
        return;
    }

    exchangesList.innerHTML = currentExchanges.map(exc => `
        <div class="return-exchange-card">
            <div class="return-exchange-header">
                <div class="return-exchange-id" data-testid="text-exchange-id">Exchange #${exc.id}</div>
                <div>Order: ${exc.orderId} | ${formatDate(exc.date)}</div>
                <span class="return-exchange-status status-${exc.status}" data-testid="status-exchange-${exc.id}">${exc.status}</span>
            </div>
            <div class="return-exchange-details">
                <div class="detail-item">
                    <strong>Original Product:</strong> <span data-testid="text-original-product">${exc.originalProduct}</span>
                </div>
                <div class="detail-item">
                    <strong>New Product:</strong> <span data-testid="text-new-product">${exc.newProduct}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Add active class to clicked tab
    event.target.classList.add('active');
}

function trackOrder(orderId) {
    const currentOrders = getCurrentUserOrders();
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('trackingModal');
    const title = document.getElementById('trackingTitle');
    const body = document.getElementById('trackingBody');
    
    title.textContent = `Order Tracking - ${orderId}`;
    body.innerHTML = `
        <div class="tracking-info">
            ${order.tracking.map((step, index) => `
                <div class="tracking-step">
                    <div class="step-icon ${step.status}">
                        ${step.status === 'completed' ? '<i class="fas fa-check"></i>' : 
                          step.status === 'current' ? '<i class="fas fa-clock"></i>' : 
                          '<i class="fas fa-circle"></i>'}
                    </div>
                    <div class="step-details">
                        <div class="step-title">${step.step}</div>
                        <div class="step-date">${step.date ? formatDate(step.date) : 'Pending'}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    modal.classList.add('active');
}

function requestReturn(orderId) {
    showReturnExchangeModal('Return', orderId);
}

function requestExchange(orderId) {
    showReturnExchangeModal('Exchange', orderId);
}

function showReturnExchangeModal(type, orderId) {
    const currentOrders = getCurrentUserOrders();
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('returnExchangeModal');
    const title = document.getElementById('returnExchangeTitle');
    
    title.textContent = `Request ${type}`;
    modal.classList.add('active');

    // Handle form submission
    const form = document.getElementById('returnExchangeForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const reason = document.getElementById('reason').value;
        const description = document.getElementById('description').value;
        
        if (type === 'Return') {
            const returnData = {
                id: 'RET' + Date.now(),
                orderId: orderId,
                product: order.items[0].name,
                reason: reason,
                status: 'pending',
                date: new Date().toISOString(),
                userId: JSON.parse(localStorage.getItem('currentUser')).email
            };
            
            userActions.returns.push(returnData);
            saveUserActions();
            showNotification('Return request submitted successfully!');
            
        } else if (type === 'Exchange') {
            const exchangeData = {
                id: 'EXC' + Date.now(),
                orderId: orderId,
                originalProduct: order.items[0].name,
                newProduct: 'Same product (different size/color)',
                reason: reason,
                status: 'pending',
                date: new Date().toISOString(),
                userId: JSON.parse(localStorage.getItem('currentUser')).email
            };
            
            userActions.exchanges.push(exchangeData);
            saveUserActions();
            showNotification('Exchange request submitted successfully!');
        }
        
        modal.classList.remove('active');
        form.reset();
        
        // Refresh the appropriate tab
        if (type === 'Return') {
            loadReturns();
        } else {
            loadExchanges();
        }
    };
}

function setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Update customer data
        customerData.firstName = document.getElementById('firstName').value;
        customerData.lastName = document.getElementById('lastName').value;
        customerData.phone = document.getElementById('phone').value;
        customerData.address = document.getElementById('address').value;
        
        // Save to localStorage (in a real app, this would be saved to a database)
        localStorage.setItem('customerData', JSON.stringify(customerData));
        
        showNotification('Profile updated successfully!');
    });
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Check for admin credentials
    if (email === 'admin@store.com' && password === 'admin123') {
        localStorage.setItem('currentUser', JSON.stringify({ email: email, name: 'Admin' }));
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('isUserLoggedIn', 'true');
        showNotification('Welcome Admin! Redirecting to dashboard...');
        closeLoginModal();
        
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
        return;
    }
    
    // Simulate login process
    showNotification(`Welcome back! Logged in as ${email}`);
    localStorage.setItem('currentUser', JSON.stringify({ email: email, name: email.split('@')[0] }));
    localStorage.setItem('isUserLoggedIn', 'true');
    closeLoginModal();
    
    // Clear form
    document.getElementById('loginForm').reset();
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Logout function
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        localStorage.setItem('isUserLoggedIn', 'false');
        window.location.href = 'index.html';
    }
}