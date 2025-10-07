// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    checkAdminAccess();
    loadDashboardData();
});

function checkAdminAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (!currentUser || !isAdmin || currentUser.email !== 'admin@store.com') {
        // Redirect to home if not admin
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Admin access verified');
}

function loadDashboardData() {
    // Load real data from localStorage or use defaults
    updateStats();
    loadRecentOrders();
}

function updateStats() {
    // Get data from localStorage
    const allOrders = JSON.parse(localStorage.getItem('allOrders')) || [];
    const allCustomers = JSON.parse(localStorage.getItem('allCustomers')) || [];
    const allProducts = JSON.parse(localStorage.getItem('allProducts')) || [];
    
    // Calculate stats
    const totalOrders = allOrders.length;
    const totalCustomers = allCustomers.length;
    const totalProducts = allProducts.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Update DOM
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = totalOrders || '156';
        statNumbers[1].textContent = totalCustomers || '89';
        statNumbers[2].textContent = totalProducts || '24';
        statNumbers[3].textContent = `₹${totalRevenue.toFixed(2) || '45,678'}`;
    }
}

function loadRecentOrders() {
    // This would load real order data in a production app
    console.log('Loading recent orders...');
}

function logoutAdmin() {
    if (confirm('Are you sure you want to logout from admin dashboard?')) {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('currentUser');
        localStorage.setItem('isUserLoggedIn', 'false');
        window.location.href = 'index.html';
    }
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
        top: 120px;
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