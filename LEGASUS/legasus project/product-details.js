// Global variables
let currentOrder = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.email) {
        // Redirect to login page if not logged in
        window.location.href = 'verify-product.html';
        return;
    }
    
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    
    if (!orderId) {
        // Redirect to orders page if no order ID
        window.location.href = 'customer-orders.html';
        return;
    }
    
    // Load order details
    loadOrderDetails(orderId, currentUser.email);
});

// Load order details
function loadOrderDetails(orderId, userEmail) {
    // Get user actions from localStorage
    const userActions = JSON.parse(localStorage.getItem('userActions') || '{}');
    
    // Find the order
    if (userActions.orders) {
        currentOrder = userActions.orders.find(order => 
            order.orderId === orderId && order.userId === userEmail
        );
    }
    
    // Display order details or redirect if not found
    if (currentOrder) {
        displayOrderDetails();
    } else {
        // Redirect to orders page if order not found
        window.location.href = 'customer-orders.html';
    }
}

// Display order details
function displayOrderDetails() {
    // Update order ID
    document.getElementById('orderIdDisplay').textContent = currentOrder.orderId;
    
    // Update order date
    const orderDate = new Date(currentOrder.date);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('orderDate').textContent = formattedDate;
    
    // Update order status
    const statusElement = document.getElementById('orderStatus');
    statusElement.textContent = currentOrder.status;
    statusElement.className = 'verification-status status-' + currentOrder.status.toLowerCase();
    
    // Update product details
    const firstItem = currentOrder.items[0];
    
    document.getElementById('productImage').src = firstItem.image;
    document.getElementById('productName').textContent = firstItem.name;
    document.getElementById('productPrice').textContent = `₹${firstItem.price.toFixed(2)}`;
    document.getElementById('productSize').textContent = firstItem.size;
    document.getElementById('productQuantity').textContent = firstItem.quantity;
    
    // Update order total
    document.getElementById('orderTotal').textContent = `₹${currentOrder.total.toFixed(2)}`;
    
    // Show product details section
    document.getElementById('productDetails').classList.add('active');
    
    // Setup back button
    document.getElementById('backToOrdersBtn').addEventListener('click', function() {
        window.location.href = 'customer-orders.html';
    });
}