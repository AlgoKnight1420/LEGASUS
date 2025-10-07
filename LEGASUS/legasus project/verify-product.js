// Global variables
let orderId = '';
let isOtpSent = false;
let isLoggedIn = false;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const otpContainer = document.getElementById('otpContainer');
const otpInput = document.getElementById('otp');
const verifyBtn = document.getElementById('verifyBtn');
const resendOtpBtn = document.getElementById('resendOtp');
const orderIdDisplay = document.getElementById('orderIdDisplay');
const emailError = document.getElementById('emailError');
const otpError = document.getElementById('otpError');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('order') || urlParams.get('orderId');
    
    if (!orderId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display order ID
    orderIdDisplay.textContent = `Order ID: ${orderId}`;
    
    // Setup event listeners
    loginForm.addEventListener('submit', handleFormSubmit);
    resendOtpBtn.addEventListener('click', sendOtp);
    
    // Check if user is already logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.email) {
        emailInput.value = currentUser.email;
        isLoggedIn = true;
        sendOtp();
    }
});

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!isOtpSent) {
        // First step: Send OTP
        sendOtp();
    } else {
        // Second step: Verify OTP
        verifyOtp();
    }
}

// Send OTP
function sendOtp() {
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
        emailError.style.display = 'block';
        return;
    }
    
    emailError.style.display = 'none';
    
    // Simulate OTP sending
    setTimeout(() => {
        // Show OTP input
        otpContainer.style.display = 'block';
        verifyBtn.textContent = 'Verify OTP';
        isOtpSent = true;
        
        // Generate a random 6-digit OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in localStorage (in a real app, this would be sent to server)
        localStorage.setItem('currentOtp', generatedOtp);
        
        // Show notification
        alert(`OTP sent to ${email}. Please check your email/phone for the verification code.`);
        
        // For testing purposes only - show in console
        console.log(`Generated OTP: ${generatedOtp}`);
    }, 1000);
}

// Verify OTP
function verifyOtp() {
    const otp = otpInput.value.trim();
    const storedOtp = localStorage.getItem('currentOtp');
    
    if (otp !== storedOtp) {
        otpError.style.display = 'block';
        return;
    }
    
    otpError.style.display = 'none';
    
    // Store user info
    const userEmail = emailInput.value.trim();
    const currentUser = {
        email: userEmail,
        isVerified: true
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Create mock orders for the user if none exist
    createMockOrdersIfNeeded(userEmail, orderId);
    
    // Redirect to customer orders page
    window.location.href = 'customer-orders.html';
}

// Validate email or phone
function validateEmail(email) {
    // Simple validation for demo purposes
    return email.length > 5 && (email.includes('@') || /^\d{10}$/.test(email));
}

// Create or retrieve order history for the user
function createMockOrdersIfNeeded(userEmail, currentOrderId) {
    // Get existing user actions or create new ones
    let userActions = JSON.parse(localStorage.getItem('userActions') || '{}');
    
    // Initialize orders array if it doesn't exist
    if (!userActions.orders) {
        userActions.orders = [];
    }
    
    // Check if the current order already exists
    const orderExists = userActions.orders.some(order => order.orderId === currentOrderId);
    
    // Add the current order if it doesn't exist
    if (!orderExists) {
        // Get all products from localStorage
        const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
        
        // Select a product based on order ID (deterministic selection)
        const productIndex = parseInt(currentOrderId.replace(/\D/g, '')) % Math.max(allProducts.length, 1);
        const selectedProduct = allProducts.length > 0 ? 
            allProducts[productIndex] : 
            {
                id: 1,
                name: 'Premium Black T-Shirt',
                price: 1299,
                image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1915&q=80'
            };
        
        // Create a new order with realistic details
        const newOrder = {
            orderId: currentOrderId,
            userId: userEmail,
            date: new Date().toISOString(),
            status: 'Delivered',
            items: [
                {
                    productId: selectedProduct.id,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    quantity: 1,
                    size: 'M',
                    image: selectedProduct.image
                }
            ],
            total: selectedProduct.price,
            shippingAddress: '123 Main St, City, State, 12345',
            paymentMethod: 'Credit Card'
        };
        
        // Add the new order
        userActions.orders.push(newOrder);
        
        // Add previous orders if this is the first order
        if (userActions.orders.length === 1) {
            // Create 2-3 previous orders with realistic dates
            const numPreviousOrders = 2 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < numPreviousOrders; i++) {
                // Select a different product for each previous order
                const productIdx = (productIndex + i + 1) % Math.max(allProducts.length, 1);
                const product = allProducts.length > 0 ? 
                    allProducts[productIdx] : 
                    {
                        id: i + 2,
                        name: `LEGASUS Premium Collection Item ${i + 1}`,
                        price: 999 + i * 500,
                        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1915&q=80'
                    };
                
                // Create a previous order date (between 7-90 days ago)
                const orderDate = new Date();
                orderDate.setDate(orderDate.getDate() - (7 + i * 30 + Math.floor(Math.random() * 7)));
                
                // Generate a realistic order ID
                const orderIdNumber = Math.floor(100000 + Math.random() * 900000);
                
                // Create a previous order with realistic details
                const previousOrder = {
                    orderId: 'LEGASUS-' + orderIdNumber,
                    userId: userEmail,
                    date: orderDate.toISOString(),
                    status: 'Delivered',
                    items: [
                        {
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: 1 + Math.floor(Math.random() * 2),
                            size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
                            image: product.image
                        }
                    ],
                    total: product.price,
                    shippingAddress: '123 Main St, City, State, 12345',
                    paymentMethod: 'Credit Card'
                };
                
                // Calculate total based on quantity
                previousOrder.total = previousOrder.items[0].price * previousOrder.items[0].quantity;
                
                // Add the previous order
                userActions.orders.push(previousOrder);
            }
        }
        
        // Save updated user actions
        localStorage.setItem('userActions', JSON.stringify(userActions));
    }
}