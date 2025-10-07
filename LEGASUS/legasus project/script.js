// API URL for backend server
const API_URL = "http://localhost:8080";

let products = [];

// User authentication state
let isUserLoggedIn = false;
let currentUser = null;

// User action tracking
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

// // ===================== AUTH & USERS =====================
// Using API client for user operations

// Register User
async function registerUser(name, email, password) {
  try {
    const response = await api.users.register({ name, email, password });
    alert("Registration successful!");
    return response;
  } catch (error) {
    alert("Registration failed: " + error.message);
    return false;
  }
}

// Login User
async function loginUser(email, password) {
  try {
    const response = await api.users.login({ email, password });
    currentUser = response.user;
    isUserLoggedIn = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert("Login successful!");
    return true;
  } catch (error) {
    alert("Login failed: " + error.message);
    return false;
  }
}

// Logout User
function logoutUser() {
  currentUser = null;
  isUserLoggedIn = false;
  localStorage.removeItem('currentUser');
  alert("Logged out successfully!");
}
// Login Handler
async function handleLogin(email, password) {
  const success = await loginUser(email, password);
  
  if (success) {
    if (currentUser.role === "admin") {
  currentUser.isAdmin = true; // ✅ Add this
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  localStorage.setItem('isAdmin', 'true');
  window.location.href = "admin-dashboard.html";
}

    // if (currentUser.role === "admin") {
    //   // Set isAdmin flag in localStorage for admin users
    //   localStorage.setItem('isAdmin', 'true');  
    //   window.location.href = "admin-dashboard.html";
    // } 
    else {
      // Ensure isAdmin flag is removed for non-admin users
      localStorage.removeItem('isAdmin');
      window.location.href = "customer-profile.html";
    }
  }
}

// Check if user is logged in on page load
function checkLoginStatus() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    isUserLoggedIn = true;
    
    // Set isAdmin flag based on user role
    if (currentUser.role === 'admin') {
      localStorage.setItem('isAdmin', 'true');
    } else {
      localStorage.removeItem('isAdmin');
    }
    
    return true;
  }
  return false;
}

// ===================== LOGIN MODAL EVENTS =====================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  
  // Check login status on page load
  checkLoginStatus();
  
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const pass = document.getElementById("loginPassword").value.trim();
      await handleLogin(email, pass);
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("registerName").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const pass = document.getElementById("registerPassword").value.trim();
      await registerUser(name, email, pass);
    });
  }

  updateLoginButtonState();
  
  // Load products on homepage
  if (document.getElementById("productsContainer")) {
    loadProducts();
  }
});

// ===================== LOGIN BUTTON STATE =====================
function updateLoginButtonState() {
  const btn = document.getElementById("loginBtn");
  
  if (btn) {
    if (isUserLoggedIn && currentUser && currentUser.role) {
      btn.textContent = currentUser.role === "admin" ? "Admin" : "Profile";
      btn.onclick = () => {
        if (currentUser.role === "admin") {
          // Check if admin is still logged in
          const isAdmin = localStorage.getItem('isAdmin') === 'true';
          if (isAdmin) {
            window.location.href = "admin-dashboard.html";
          } else {
            // If isAdmin flag is not set, treat as regular user
            window.location.href = "customer-profile.html";
          }
        } else {
          window.location.href = "customer-profile.html";
        }
      };
    } else {
      btn.textContent = "Login";
      btn.onclick = () => {
        openAuthModal('login');
      };
    }
  }
}

// Track product click
function trackProductClick(productId) {
    if (!isUserLoggedIn || !currentUser) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Add to user actions
    userActions.productClicks.push({
        productId,
        productName: product.name,
        timestamp: new Date().toISOString()
    });
    
    // Save to localStorage
    saveUserActions();
}
    


// Track order placement
async function trackOrderPlacement(orderData) {
    if (!isUserLoggedIn || !currentUser) return;
    
    try {
        // Create order in backend
        const orderResponse = await api.orders.createOrder({
            userId: currentUser.id,
            products: orderData.items,
            totalAmount: orderData.total,
            shippingAddress: orderData.shippingAddress
        });
        
        // Add to user actions
        const order = {
            id: orderResponse.id,
            date: new Date().toISOString(),
            status: 'processing',
            total: orderData.total,
            items: orderData.items,
            userId: currentUser.id
        };
        
        userActions.orders.push(order);
        saveUserActions();
        
        return orderResponse;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}
    
// Load products from API
async function loadProducts() {
    try {
        const productsContainer = document.getElementById("productsContainer");
        if (!productsContainer) return;
        
        // Show loading state
        productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
        
        // Fetch products from API
        products = await api.products.getAllProducts();
        
        // Display products
        displayProducts(products, productsContainer);
    } catch (error) {
        console.error('Error loading products:', error);
        const productsContainer = document.getElementById("productsContainer");
        if (productsContainer) {
            productsContainer.innerHTML = `<div class="error">Error loading products: ${error.message}</div>`;
        }
    }
}

// Display products in container
function displayProducts(productsList, container) {
    if (!container) return;
    
    if (!productsList || productsList.length === 0) {
        container.innerHTML = '<div class="no-products">No products available</div>';
        return;
    }
    
    container.innerHTML = '';
    
    productsList.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => trackProductClick(product.id);
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.imageUrl || 'images/placeholder.jpg'}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">₹${product.price}</p>
                <p class="product-status ${product.stockStatus === 'in_stock' ? 'in-stock' : 'out-of-stock'}">
                    ${product.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                </p>
                <button class="add-to-cart-btn" data-product-id="${product.id}" 
                    ${product.stockStatus !== 'in_stock' ? 'disabled' : ''}>
                    Add to Cart
                </button>
            </div>
        `;
        
        container.appendChild(productCard);
    });
    
    // Add event listeners to Add to Cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering product click
            const productId = button.getAttribute('data-product-id');
            addToCart(productId);
        });
    });
}

// Add product to cart
function addToCart(productId) {
    if (!productId) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Get current cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1
        });
    }
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart UI
    updateCartCount();
    
    // Show notification
    showNotification(`${product.name} added to cart!`);
}

// Update cart count in UI
function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (!cartCountElement) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCountElement.textContent = totalItems;
    cartCountElement.style.display = totalItems > 0 ? 'block' : 'none';
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
// Process checkout
async function processCheckout(checkoutData) {
    if (!isUserLoggedIn || !currentUser) {
        alert('Please login to checkout');
        return false;
    }
    
    try {
        // Create order first
        const orderResponse = await trackOrderPlacement({
            items: checkoutData.items,
            total: checkoutData.total,
            shippingAddress: checkoutData.shippingAddress
        });
        
        // Create Razorpay order
        const razorpayOrder = await api.payments.createRazorpayOrder({
            amount: checkoutData.total * 100, // Convert to paise
            orderId: orderResponse.id
        });
        
        // Initialize Razorpay checkout
        const options = {
            key: razorpayOrder.key,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'Legasus',
            description: 'Purchase',
            order_id: razorpayOrder.id,
            handler: function(response) {
                // Verify payment
                verifyPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    orderId: orderResponse.id
                });
            },
            prefill: {
                name: currentUser.name,
                email: currentUser.email,
                contact: currentUser.phone || ''
            },
            theme: {
                color: '#3399cc'
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
        return true;
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Checkout failed: ' + error.message);
        return false;
    }
}

// Verify payment
async function verifyPayment(paymentData) {
    try {
        const result = await api.payments.verifyPayment(paymentData);
        
        if (result.success) {
            // Clear cart
            localStorage.removeItem('cart');
            updateCartCount();
            
            // Show success message
            showNotification('Payment successful! Order placed.');
            
            // Redirect to order confirmation
            window.location.href = `order-confirmation.html?orderId=${paymentData.orderId}`;
        } else {
            alert('Payment verification failed: ' + result.message);
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        alert('Payment verification failed: ' + error.message);
    }
}



// API URL is already defined at the top of the file
// User authentication state is already defined at the top of the file
// User action tracking is already defined at the top of the file
// loadUserActions and saveUserActions functions are already defined at the top of the file
// ===================== AUTH & USERS =====================
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

// Register User function is already defined above using API
// Login handler is already defined above
// This duplicate event listener is removed to avoid conflicts
// updateLoginButtonState function is already defined above
    // Removed duplicate code
    // Removed duplicate code



// ===================== PRODUCT TRACKING (unchanged from before) =====================
function trackProductClick(productId) {
    if (!isUserLoggedIn || !currentUser) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const clickData = {
        id: Date.now(),
        productId: productId,
        productName: product.name,
        productImage: product.images ? product.images.main : product.image,
        productPrice: product.price,
        timestamp: new Date().toISOString(),
        userId: currentUser.email
    };
    
    userActions.productClicks.push(clickData);
    saveUserActions();
}

function trackOrderPlacement(orderData) {
    if (!isUserLoggedIn || !currentUser) return;
    
    const order = {
        id: orderData.orderNumber,
        date: new Date().toISOString(),
        status: 'processing',
        total: orderData.total,
        items: orderData.items,
        userId: currentUser.email,
        tracking: [
            { step: 'Order Placed', date: new Date().toISOString(), status: 'completed' },
            { step: 'Processing', date: '', status: 'pending' },
            { step: 'Shipped', date: '', status: 'pending' },
            { step: 'Delivered', date: '', status: 'pending' }
        ]
    };
    
    userActions.orders.push(order);
    saveUserActions();
}

// ... rest of your existing functions (returns, exchanges, products etc.) remain unchanged ...


// Generate sample data for new users (for demonstration)
function generateSampleData() {
    if (!isUserLoggedIn || !currentUser) return;
    
    // Check if user already has data
    const userOrders = userActions.orders.filter(order => order.userId === currentUser.email);
    if (userOrders.length > 0) return; // User already has data
    
    // Generate sample orders based on recent product clicks
    const recentClicks = userActions.productClicks
        .filter(click => click.userId === currentUser.email)
        .slice(-3); // Last 3 clicks
    
    if (recentClicks.length === 0) return;
    
    // Create sample orders from clicked products
    recentClicks.forEach((click, index) => {
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - (index + 1) * 7); // Spread orders over weeks
        
        const order = {
            id: 'SAMPLE' + (Date.now() + index),
            date: orderDate.toISOString(),
            status: index === 0 ? 'delivered' : index === 1 ? 'shipped' : 'processing',
            total: click.productPrice,
            items: [{
                name: click.productName,
                price: click.productPrice,
                image: click.productImage,
                size: 'M',
                quantity: 1
            }],
            userId: currentUser.email,
            tracking: [
                { step: 'Order Placed', date: orderDate.toISOString(), status: 'completed' },
                { step: 'Processing', date: new Date(orderDate.getTime() + 24*60*60*1000).toISOString(), status: 'completed' },
                { step: 'Shipped', date: index < 2 ? new Date(orderDate.getTime() + 2*24*60*60*1000).toISOString() : '', status: index < 2 ? 'completed' : 'pending' },
                { step: 'Delivered', date: index === 0 ? new Date(orderDate.getTime() + 4*24*60*60*1000).toISOString() : '', status: index === 0 ? 'completed' : 'pending' }
            ]
        };
        
        userActions.orders.push(order);
    });
    
    saveUserActions();
}

// Track return request
function trackReturnRequest(orderId, productName, reason) {
    if (!isUserLoggedIn || !currentUser) return;
    
    const returnData = {
        id: 'RET' + Date.now(),
        orderId: orderId,
        product: productName,
        reason: reason,
        status: 'pending',
        date: new Date().toISOString(),
        userId: currentUser.email
    };
    
    userActions.returns.push(returnData);
    saveUserActions();
}

// Track exchange request
function trackExchangeRequest(orderId, originalProduct, newProduct, reason) {
    if (!isUserLoggedIn || !currentUser) return;
    
    const exchangeData = {
        id: 'EXC' + Date.now(),
        orderId: orderId,
        originalProduct: originalProduct,
        newProduct: newProduct,
        reason: reason,
        status: 'pending',
        date: new Date().toISOString(),
        userId: currentUser.email
    };
    
    userActions.exchanges.push(exchangeData);
    saveUserActions();
}

// Load products from API or fallback to local array
async function loadProducts() {
    if (API_URL) {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Failed to fetch products");
            products = await response.json();
            console.log("Products loaded from API:", products);
        } catch (error) {
            console.error("Error loading from API, using local data:", error);
            products = getLocalProducts();
        }
    } else {
        products = getLocalProducts();
    }

    // Load admin products and merge them with main products
    const adminProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
    products = [...products, ...adminProducts];

    renderLatestCollection();
    renderBestSellers();
    renderProducts();
}

// User state management functions
function initializeUserState() {
    const savedUser = localStorage.getItem('currentUser');
    const savedLoginState = localStorage.getItem('isUserLoggedIn');
    
    if (savedUser && savedLoginState === 'true') {
        isUserLoggedIn = true;
        currentUser = JSON.parse(savedUser);
        
        // Set isAdmin flag based on user role
        if (currentUser.role === 'admin' || currentUser.isAdmin) {
            localStorage.setItem('isAdmin', 'true');
        } else {
            localStorage.removeItem('isAdmin');
        }
        
        updateLoginButtonState();
    }
}

function updateLoginButtonState() {
    console.log('updateLoginButtonState called');
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) {
        console.warn('Login button not found, skipping update');
        return;
    }
    
    console.log('Updating login button state. isUserLoggedIn:', isUserLoggedIn, 'currentUser:', currentUser);
    
    if (isUserLoggedIn && currentUser) {
        console.log('User is logged in, setting profile button');
        
        // Check if user is admin
        const isAdmin = currentUser.role === 'admin' || currentUser.isAdmin;
        
        loginBtn.innerHTML = `
            <i class="fas fa-user"></i>
            <span class="desktop-only">${isAdmin ? 'Admin' : currentUser.email.split('@')[0]}</span>
        `;
        
        // Change click behavior based on user role
        if (isAdmin && localStorage.getItem('isAdmin') === 'true') {
            // For admin users, redirect to admin dashboard
            loginBtn.onclick = () => {
                window.location.href = 'admin-dashboard.html';
            };
            console.log('Admin profile onclick set');
        } else {
            // For regular users, use openCustomerProfile
            loginBtn.onclick = openCustomerProfile;
            console.log('Customer profile onclick set');
        }
    } else {
        console.log('User is not logged in, setting login button');
        loginBtn.innerHTML = `
            <i class="fas fa-user"></i>
            <span class="desktop-only">Login</span>
        `;
        // Change click behavior to open login modal
        loginBtn.onclick = () => {
            console.log('Login button clicked, calling openAuthModal');
            openAuthModal('login');
        };
        console.log('Login onclick set:', loginBtn.onclick);
    }
}

function openCustomerProfile() {
    // Check if user is admin and isAdmin flag is set
    if (currentUser && currentUser.role === 'admin' && localStorage.getItem('isAdmin') === 'true') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'customer-profile.html';
    }
}

function logoutUser() {
    isUserLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.setItem('isUserLoggedIn', 'false');
    updateLoginButtonState();
    showNotification('Logged out successfully!');
}

function getLocalProducts() {
    return [
        {
            id: 1,
            name: "Velocity Racing Tee",
            price: 49.99,
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "men",
            season: "summer",
            description: "High-performance racing tee made with moisture-wicking fabric. Perfect for athletic activities and casual wear.",
            sizes: ["XS", "S", "M", "L", "XL", "XXL"],
            material: "Cotton blend with moisture-wicking technology",
            care: "Machine wash cold, tumble dry low"
        },
        {
            id: 2,
            name: "Burnout Performance Tank",
            price: 39.99,
            image: "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "men",
            season: "summer",
            description: "Lightweight performance tank with burnout design for maximum breathability.",
            sizes: ["S", "M", "L", "XL", "XXL"],
            material: "100% polyester with burnout texture",
            care: "Machine wash cold, air dry"
        },
        {
            id: 3,
            name: "Urban Street Hoodie",
            price: 79.99,
            image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "men",
            season: "winter",
            description: "Comfortable urban hoodie with automotive-inspired graphics.",
            sizes: ["S", "M", "L", "XL", "XXL"],
            material: "Cotton-polyester blend fleece",
            care: "Machine wash warm, tumble dry medium"
        },
        {
            id: 4,
            name: "Racing Jacket Pro",
            price: 129.99,
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "men",
            season: "winter",
            description: "Professional racing jacket with leather trim and embroidery.",
            sizes: ["S", "M", "L", "XL", "XXL"],
            material: "Nylon shell with leather accents",
            care: "Dry clean only"
        },
        {
            id: 5,
            name: "Speed Demon Crop Top",
            price: 34.99,
            image: "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "women",
            season: "summer",
            description: "Trendy crop top with speed-inspired design elements.",
            sizes: ["XS", "S", "M", "L", "XL"],
            material: "Cotton spandex blend",
            care: "Machine wash cold, lay flat to dry"
        },
        {
            id: 6,
            name: "Motorsport Leggings",
            price: 59.99,
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "women",
            season: "summer",
            description: "High-performance leggings with motorsport-inspired patterns.",
            sizes: ["XS", "S", "M", "L", "XL"],
            material: "Compression fabric with 4-way stretch",
            care: "Machine wash cold, tumble dry low"
        },
        {
            id: 7,
            name: "Power Blazer",
            price: 149.99,
            image: "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "women",
            season: "winter",
            description: "Sophisticated blazer with automotive luxury styling.",
            sizes: ["XS", "S", "M", "L", "XL"],
            material: "Wool blend with structured shoulders",
            care: "Dry clean recommended"
        },
        {
            id: 8,
            name: "Leather Racing Gloves",
            price: 89.99,
            image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "accessories",
            season: "winter",
            description: "Premium leather racing gloves with grip technology.",
            sizes: ["S", "M", "L", "XL"],
            material: "Genuine leather with reinforced palms",
            care: "Clean with leather conditioner"
        },
        {
            id: 9,
            name: "Turbo Charge Shorts",
            price: 44.99,
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "men",
            season: "summer",
            description: "Athletic shorts with turbo-inspired design and quick-dry fabric.",
            sizes: ["S", "M", "L", "XL", "XXL"],
            material: "Quick-dry polyester blend",
            care: "Machine wash cold, tumble dry low"
        },
        {
            id: 10,
            name: "Drift Queen Dress",
            price: 94.99,
            image: "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "women",
            season: "summer",
            description: "Elegant dress with drift racing inspired cuts and details.",
            sizes: ["XS", "S", "M", "L", "XL"],
            material: "Flowing chiffon with structured bodice",
            care: "Hand wash cold, hang to dry"
        },
        {
            id: 11,
            name: "Nitro Bomber Jacket",
            price: 119.99,
            image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "women",
            season: "winter",
            description: "Stylish bomber jacket with nitro-themed embroidery.",
            sizes: ["XS", "S", "M", "L", "XL"],
            material: "Satin shell with quilted lining",
            care: "Machine wash cold, hang to dry"
        },
        {
            id: 12,
            name: "GT Championship Cap",
            price: 29.99,
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "accessories",
            season: "summer",
            description: "Official championship cap with embroidered logo.",
            sizes: ["One Size"],
            material: "Cotton twill with adjustable strap",
            care: "Spot clean only"
        },
        {
            id: 13,
            name: "Rally Thermal Hoodie",
            price: 89.99,
            image: "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "men",
            season: "winter",
            description: "Thermal hoodie designed for rally racing conditions.",
            sizes: ["S", "M", "L", "XL", "XXL"],
            material: "Thermal fleece with wind-resistant panels",
            care: "Machine wash warm, tumble dry medium"
        },
        {
            id: 14,
            name: "Speed Goddess Bodysuit",
            price: 69.99,
            image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "women",
            season: "summer",
            description: "Performance bodysuit with goddess-inspired racing motifs.",
            sizes: ["XS", "S", "M", "L", "XL"],
            material: "Stretch performance fabric",
            care: "Machine wash cold, lay flat to dry"
        },
        {
            id: 15,
            name: "Apex Racing Boots",
            price: 199.99,
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "footwear",
            season: "winter",
            description: "Professional racing boots with superior grip and protection.",
            sizes: ["7", "8", "9", "10", "11", "12"],
            material: "Synthetic leather with reinforced toe",
            care: "Wipe clean with damp cloth"
        }
    ];
}


// Global State
let cartItems = [];
let wishlistItems = [];
let activeCategory = 'all';
let authMode = 'login';
let selectedSize = 'M';
let currentProduct = null;
let searchTimeout = null;
let currentWeek = 1;
let maxWeeks = 4;
let allProductsVisible = false;

// DOM Elements (will be initialized after DOM loads)
let productsGrid, categoryTitle, cartCount, wishlistCount, mobileMenu, mobileMenuBtn;
let authModal, cartModal, wishlistModal, cartNotification, productModal, checkoutModal, orderSuccessModal, loadingOverlay;
let searchModal;

// Weekly Collections Data
const weeklyCollections = {
    1: [1, 5, 9, 13], // Week 1 product IDs
    2: [2, 6, 10, 14], // Week 2 product IDs
    3: [3, 7, 11, 15], // Week 3 product IDs
    4: [4, 8, 12, 1]   // Week 4 product IDs
};

// Best Sellers Data (based on sales performance)
const bestSellers = [1, 5, 9, 13]; // Top 4 selling products

// Initialize DOM Elements
function initializeDOMElements() {
    productsGrid = document.getElementById('productsGrid');
    categoryTitle = document.getElementById('categoryTitle');
    cartCount = document.getElementById('cartCount');
    wishlistCount = document.getElementById('wishlistCount');
    mobileMenu = document.getElementById('mobileMenu');
    mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    // Modals
    authModal = document.getElementById('authModal');
    console.log('authModal initialized:', authModal);
    cartModal = document.getElementById('cartModal');
    wishlistModal = document.getElementById('wishlistModal');
    cartNotification = document.getElementById('cartNotification');
    productModal = document.getElementById('productModal');
    checkoutModal = document.getElementById('checkoutModal');
    orderSuccessModal = document.getElementById('orderSuccessModal');
    loadingOverlay = document.getElementById('loadingOverlay');
    
    // Search Modal
    searchModal = document.getElementById('searchModal');
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    initializeDOMElements();
    loadUserActions(); // Load user action history
    loadProducts();
    renderLatestCollection();
    renderBestSellers();
    setupEventListeners();
    // Initialize user login state after DOM is ready
    initializeUserState();
    updateCounters();
    startWeeklyRotation();
    
    // Force update login button state after everything is loaded
    console.log('Forcing login button state update...');
    updateLoginButtonState();
    
    // Test login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        console.log('Login button found:', loginBtn);
        console.log('Login button onclick:', loginBtn.onclick);
        console.log('Login button innerHTML:', loginBtn.innerHTML);
    } else {
        console.error('Login button not found!');
    }
});

// Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    // Category navigation
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.getAttribute('data-category');
            changeCategory(category);
            closeMobileMenu();
        });
    });

    // Search functionality
    document.getElementById('mobileSearchToggleBtn').addEventListener('click', openSearchModal);
    document.getElementById('searchModalClose').addEventListener('click', closeSearchModal);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('searchBtn').addEventListener('click', performSearch);

    // Modal controls
    // Login button is handled dynamically in updateLoginButtonState()
    document.getElementById('mobileLoginBtn').addEventListener('click', () => openAuthModal('login'));
    document.getElementById('cartBtn').addEventListener('click', openCartModal);
    document.getElementById('wishlistBtn').addEventListener('click', openWishlistModal);

    // Modal close buttons
    document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
    document.getElementById('cartModalClose').addEventListener('click', closeCartModal);
    document.getElementById('wishlistModalClose').addEventListener('click', closeWishlistModal);
    document.getElementById('productModalClose').addEventListener('click', closeProductModal);
    document.getElementById('checkoutModalClose').addEventListener('click', closeCheckoutModal);
    document.getElementById('orderSuccessClose').addEventListener('click', closeOrderSuccessModal);

    // Continue shopping buttons
    document.getElementById('continueShopping').addEventListener('click', closeCartModal);
    document.getElementById('continueShoppingFooter').addEventListener('click', closeCartModal);
    document.getElementById('continueShoppingWishlist').addEventListener('click', closeWishlistModal);
    document.getElementById('continueShoppingSuccess').addEventListener('click', closeOrderSuccessModal);

    // Checkout functionality
    document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);

    // Auth form
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
    document.getElementById('authSwitchBtn').addEventListener('click', switchAuthMode);
    document.getElementById('passwordToggle').addEventListener('click', togglePasswordVisibility);

    // Notification close
    document.getElementById('notificationClose').addEventListener('click', closeNotification);

    // Product detail functionality
    document.getElementById('addToCartDetailBtn') && document.getElementById('addToCartDetailBtn').addEventListener('click', addToCartFromDetail);
    document.getElementById('wishlistDetailBtn') && document.getElementById('wishlistDetailBtn').addEventListener('click', toggleWishlistFromDetail);

    // Size selection
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('size-btn')) {
            document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedSize = e.target.getAttribute('data-size');
        }
    });

    // Payment method toggle
    document.addEventListener('change', (e) => {
        if (e.target.name === 'payment') {
            const cardDetails = document.getElementById('cardDetails');
            if (e.target.value === 'card') {
                cardDetails.style.display = 'block';
            } else {
                cardDetails.style.display = 'none';
            }
        }
    });

    // Close modals on backdrop click
    [authModal, cartModal, wishlistModal, productModal, checkoutModal, orderSuccessModal, searchModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Infinite scroll
    window.addEventListener('scroll', handleScroll);

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-modal')) {
            document.getElementById('searchResults').classList.remove('active');
        }
    });
}

// Search Modal Functions
function openSearchModal() {
    searchModal.classList.add('active');
    document.getElementById('searchInput').focus();
}

function closeSearchModal() {
    searchModal.classList.remove('active');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').classList.remove('active');
}

// Weekly Collection Functions
function renderLatestCollection() {
    const latestProductsGrid = document.getElementById('latestProductsGrid');
    const currentWeekElement = document.getElementById('currentWeek');
    
    currentWeekElement.textContent = currentWeek;
    
    const weeklyProductIds = weeklyCollections[currentWeek];
    const weeklyProducts = products.filter(product => weeklyProductIds.includes(product.id));
    
    latestProductsGrid.innerHTML = weeklyProducts.map(product => createProductCard(product)).join('');
}

function showAllLatestProducts() {
    // Show the all products section
    document.getElementById('allProductsSection').style.display = 'block';
    
    // Hide other main sections
    document.querySelector('.latest-collection').style.display = 'none';
    document.querySelector('.demo-video-section').style.display = 'none';
    document.querySelector('.best-sellers').style.display = 'none';
    
    // Update the category title to show "All Latest Products"
    const categoryTitle = document.getElementById('categoryTitle');
    categoryTitle.textContent = 'All Latest Products';
    
    // Get all products from all weekly collections
    const allWeeklyProductIds = Object.values(weeklyCollections).flat();
    const allLatestProducts = products.filter(product => allWeeklyProductIds.includes(product.id));
    
    // Render these products in the products grid
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = allLatestProducts.map(product => createProductCard(product)).join('');
    
    // Scroll to the all products section
    document.getElementById('allProductsSection').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function startWeeklyRotation() {
    // Change collection every 30 seconds for demo (in real app, this would be weekly)
    setInterval(() => {
        currentWeek = currentWeek >= maxWeeks ? 1 : currentWeek + 1;
        renderLatestCollection();
    }, 30000); // 30 seconds for demo
}

// Best Sellers Functions
function renderBestSellers() {
    const bestSellersGrid = document.getElementById('bestSellersGrid');
    const bestSellerProducts = products.filter(product => bestSellers.includes(product.id));
    
    bestSellersGrid.innerHTML = bestSellerProducts.map(product => createProductCard(product)).join('');
}

// Demo Video Functions
function playDemoVideo() {
    const video = document.querySelector('.demo-video');
    const overlay = document.querySelector('.video-overlay');
    
    if (video.paused) {
        video.play();
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
    } else {
        video.pause();
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    }
}

// Mobile Menu Functions
function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
}

function closeMobileMenu() {
    mobileMenu.classList.remove('active');
}

// Category Functions
function changeCategory(category) {
    // Store isAdmin flag before changing category
    const isAdminFlag = localStorage.getItem('isAdmin');
    
    activeCategory = category;
    
    // Update active states
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.classList.add('active');
    });

    // Update title
    const categoryTitles = {
        all: 'All Products',
        men: 'Men\'s Collection',
        women: 'Women\'s Collection',
        summer: 'Summer Collection',
        winter: 'Winter Collection'
    };
    categoryTitle.textContent = categoryTitles[category];
    
    // Restore isAdmin flag after changing category
    if (isAdminFlag === 'true') {
        localStorage.setItem('isAdmin', 'true');
    }

    renderProducts();
}

// Search Functions
function handleSearch(e) {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);
    
    if (query.length === 0) {
        document.getElementById('searchResults').classList.remove('active');
        return;
    }

    searchTimeout = setTimeout(() => {
        performSearchQuery(query, 'searchResults');
    }, 300);
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        performSearchQuery(query, 'searchResults');
    }
}

function performSearchQuery(query, resultsId) {
    const results = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.season.toLowerCase().includes(query.toLowerCase())
    );

    const resultsContainer = document.getElementById(resultsId);
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 1rem; color: #9ca3af; text-align: center;">No products found</div>';
    } else {
        resultsContainer.innerHTML = results.slice(0, 5).map(product => `
            <div class="search-result-item" onclick="navigateToProduct(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="search-result-image">
                <div class="search-result-info">
                    <div class="search-result-name">${product.name}</div>
                    <div class="search-result-price">₹${product.price}</div>
                </div>
            </div>
        `).join('');
    }
    
    resultsContainer.classList.add('active');
}

// Navigation Functions
function navigateToProduct(productId) {
    // Track product click
    trackProductClick(productId);
    
    // Store product data in localStorage for the product page
    const product = products.find(p => p.id === productId);
    if (product) {
        localStorage.setItem('selectedProduct', JSON.stringify(product));
        localStorage.setItem('allProducts', JSON.stringify(products));
        // Navigate to product page
        window.location.href = `product.html?id=${productId}`;
    }
}

function renderSearchResults(results) {
    activeCategory = 'search';
    categoryTitle.textContent = `Search Results (${results.length} found)`;
    
    // Show all products section
    document.getElementById('allProductsSection').style.display = 'block';
    allProductsVisible = true;
    
    // Hide other sections
    document.querySelector('.latest-collection').style.display = 'none';
    document.querySelector('.demo-video-section').style.display = 'none';
    document.querySelector('.best-sellers').style.display = 'none';
    
    productsGrid.innerHTML = results.map(product => createProductCard(product)).join('');
    
    // Scroll to products section
    document.getElementById('allProductsSection').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Product Functions
function renderProducts() {
    const filteredProducts = activeCategory === 'all' 
        ? products 
        : products.filter(product => 
            product.category === activeCategory || 
            product.season === activeCategory
        );
    
    if (allProductsVisible) {
        productsGrid.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
    }
}

function createProductCard(product) {
    const isInWishlist = wishlistItems.some(item => item.id === product.id);
    const isInCart = cartItems.some(item => item.id === product.id);
    const isOutOfStock = product.stockStatus === "out_of_stock";
    
    return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock-product' : ''}" data-product-id="${product.id}">
            <div class="product-image-container">
                <img src="${product.images ? product.images.main : product.image}" alt="${product.name}" class="product-image" onclick="navigateToProduct(${product.id})">
                <div class="product-overlay">
                    <button class="quick-view-btn" onclick="navigateToProduct(${product.id})">
                        <i class="fas fa-eye"></i>
                        Quick View
                    </button>
                </div>
                <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})">
                    <i class="fas fa-heart"></i>
                </button>
                ${product.category === 'summer' ? '<span class="product-badge summer">Summer</span>' : ''}
                ${product.category === 'winter' ? '<span class="product-badge winter">Winter</span>' : ''}
                ${isOutOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name" onclick="navigateToProduct(${product.id})">${product.name}</h3>
                <p class="product-price">₹${product.price}</p>
                <div class="product-actions">
                    <button class="btn btn-primary ${isInCart ? 'added' : ''} ${isOutOfStock ? 'disabled' : ''}" onclick="${isOutOfStock ? '' : 'addToCart('+product.id+')'}" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas ${isInCart ? 'fa-check' : 'fa-shopping-cart'}"></i>
                        ${isOutOfStock ? 'Out of Stock' : isInCart ? 'Added' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showAllProducts() {
    allProductsVisible = true;
    document.getElementById('allProductsSection').style.display = 'block';
    
    // Hide other sections
    document.querySelector('.latest-collection').style.display = 'none';
    document.querySelector('.demo-video-section').style.display = 'none';
    document.querySelector('.best-sellers').style.display = 'none';
    
    renderProducts();
    
    // Scroll to products section
    document.getElementById('allProductsSection').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function openProductDetail(productId) {
    navigateToProduct(productId);
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            ...product,
            quantity: 1,
            selectedSize: selectedSize
        });
    }
    
    updateCounters();
    showNotification(`${product.name} added to cart!`);
    updateCartDisplay();
    
    // Update button state
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
        const btn = productCard.querySelector('.btn-primary');
        btn.classList.add('added');
        btn.innerHTML = '<i class="fas fa-check"></i> Added';
    }
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    updateCounters();
    updateCartDisplay();
    
    // Update button state
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
        const btn = productCard.querySelector('.btn-primary');
        btn.classList.remove('added');
        btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
    }
}

function updateCartItemQuantity(productId, quantity) {
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            updateCounters();
            updateCartDisplay();
        }
    }
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cartItems.length === 0) {
        cartItemsContainer.style.display = 'none';
        emptyCart.style.display = 'block';
        cartTotal.textContent = '₹0.00';
        return;
    }
    
    cartItemsContainer.style.display = 'block';
    emptyCart.style.display = 'none';
    
    cartItemsContainer.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4 class="cart-item-name">${item.name}</h4>
                <p class="cart-item-size">Size: ${item.selectedSize}</p>
                <p class="cart-item-price">₹${item.price}</p>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;
}

// Wishlist Functions
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = wishlistItems.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        wishlistItems.splice(existingIndex, 1);
        showNotification(`${product.name} removed from wishlist!`);
    } else {
        wishlistItems.push(product);
        showNotification(`${product.name} added to wishlist!`);
    }
    
    updateCounters();
    updateWishlistDisplay();
    
    // Update button state
    const wishlistBtns = document.querySelectorAll(`[data-product-id="${productId}"] .wishlist-btn`);
    wishlistBtns.forEach(btn => {
        btn.classList.toggle('active');
    });
}

function removeFromWishlist(productId) {
    const product = products.find(p => p.id === productId);
    wishlistItems = wishlistItems.filter(item => item.id !== productId);
    updateCounters();
    updateWishlistDisplay();
    showNotification(`${product.name} removed from wishlist!`);
    
    // Update button state
    const wishlistBtns = document.querySelectorAll(`[data-product-id="${productId}"] .wishlist-btn`);
    wishlistBtns.forEach(btn => {
        btn.classList.remove('active');
    });
}

function updateWishlistDisplay() {
    const wishlistItemsContainer = document.getElementById('wishlistItems');
    const emptyWishlist = document.getElementById('emptyWishlist');
    
    if (wishlistItems.length === 0) {
        wishlistItemsContainer.style.display = 'none';
        emptyWishlist.style.display = 'block';
        return;
    }
    
    wishlistItemsContainer.style.display = 'block';
    emptyWishlist.style.display = 'none';
    
    wishlistItemsContainer.innerHTML = wishlistItems.map(item => `
        <div class="wishlist-item">
            <img src="${item.image}" alt="${item.name}" class="wishlist-item-image" onclick="navigateToProduct(${item.id})">
            <div class="wishlist-item-info">
                <h4 class="wishlist-item-name" onclick="navigateToProduct(${item.id})">${item.name}</h4>
                <p class="wishlist-item-price">₹${item.price}</p>
                <div class="wishlist-item-actions">
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${item.id})">
                        <i class="fas fa-shopping-cart"></i>
                        Add to Cart
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="removeFromWishlist(${item.id})">
                        <i class="fas fa-trash"></i>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal Functions
function openAuthModal(mode = 'signup') {
    console.log('openAuthModal called with mode:', mode);
    console.log('authModal element:', authModal);
    
    if (!authModal) {
        console.error('Auth modal not found');
        return;
    }
    
    // Initialize registered users if needed
    initRegisteredUsers();
    
    // Default to signup mode to encourage account creation first
    authMode = mode;
    updateAuthModal();
    authModal.classList.add('active');
    console.log('Auth modal opened successfully');
}

function closeAuthModal() {
    authModal.classList.remove('active');
    document.getElementById('authForm').reset();
}

function updateAuthModal() {
    console.log('updateAuthModal called with authMode:', authMode);
    
    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const switchText = document.getElementById('authSwitchText');
    const switchBtn = document.getElementById('authSwitchBtn');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const authMessage = document.getElementById('authMessage');
    
    console.log('Auth modal elements:', { title, submitBtn, switchText, switchBtn, confirmPasswordGroup });
    
    if (authMode === 'login') {
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        switchText.textContent = "Don't have an account?";
        switchBtn.textContent = 'Sign Up';
        confirmPasswordGroup.style.display = 'none';
        
        // Add message to encourage account creation
        if (authMessage) {
            authMessage.textContent = 'You need to create an account before logging in.';
            authMessage.style.display = 'block';
        }
    } else {
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Sign Up';
        switchText.textContent = 'Already have an account?';
        switchBtn.textContent = 'Login';
        confirmPasswordGroup.style.display = 'block';
        
        // Hide message in signup mode
        if (authMessage) {
            authMessage.style.display = 'none';
        }
    }
}

function switchAuthMode() {
    authMode = authMode === 'login' ? 'signup' : 'login';
    updateAuthModal();
    document.getElementById('authForm').reset();
}

// Initialize registered users array in localStorage if it doesn't exist
function initRegisteredUsers() {
    if (!localStorage.getItem('registeredUsers')) {
        localStorage.setItem('registeredUsers', JSON.stringify([]));
    }
}

// Check if a user is registered
function isUserRegistered(email) {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return registeredUsers.some(user => user.email === email);
}

// Register a new user
function registerUser(email, password) {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    registeredUsers.push({ email, password });
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Initialize registered users if needed
    initRegisteredUsers();
    
    if (authMode === 'signup' && password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Simulate authentication
    showLoading();
    setTimeout(() => {
        hideLoading();
        
        if (authMode === 'login') {
            // Check for admin credentials
            if (email === 'admin@legasus.com' && password === 'admin123') {
                // Set user as admin
                isUserLoggedIn = true;
                currentUser = { email: email, isAdmin: true };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('isUserLoggedIn', 'true');
                localStorage.setItem('isAdmin', 'true');
                updateLoginButtonState();
                closeAuthModal();
                
                showNotification('Admin login successful!');
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1000);
                return;
            }
            
            // Check if user is registered
            if (!isUserRegistered(email)) {
                alert('Account not found. Please create an account first.');
                // Switch to signup mode
                authMode = 'signup';
                updateAuthModal();
                return;
            }
            
            // Regular user login
            isUserLoggedIn = true;
            currentUser = { email: email };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('isUserLoggedIn', 'true');
            updateLoginButtonState();
            closeAuthModal();
            
            // Generate sample data for new users
            setTimeout(() => {
                generateSampleData();
            }, 500);
            
            showNotification(`Successfully logged in! Welcome back, ${email.split('@')[0]}!`);
        } else {
            // For signup, register the user
            registerUser(email, password);
            
            // Log them in
            isUserLoggedIn = true;
            currentUser = { email: email };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('isUserLoggedIn', 'true');
            updateLoginButtonState();
            closeAuthModal();
            
            // Generate sample data for new users
            setTimeout(() => {
                generateSampleData();
            }, 500);
            
            showNotification(`Successfully signed up and logged in! Welcome, ${email.split('@')[0]}!`);
        }
    }, 1500);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('passwordToggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function openCartModal() {
    updateCartDisplay();
    cartModal.classList.add('active');
}

function closeCartModal() {
    cartModal.classList.remove('active');
}

function openWishlistModal() {
    updateWishlistDisplay();
    wishlistModal.classList.add('active');
}

function closeWishlistModal() {
    wishlistModal.classList.remove('active');
}

function openProductModal(productId) {
    navigateToProduct(productId);
}

function closeProductModal() {
    productModal.classList.remove('active');
}

function openCheckoutModal() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    updateCheckoutSummary();
    closeCartModal();
    checkoutModal.classList.add('active');
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('active');
}

function updateCheckoutSummary() {
    const summaryContainer = document.getElementById('checkoutSummaryItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    summaryContainer.innerHTML = cartItems.map(item => `
        <div class="summary-item">
            <span class="item-name">${item.name} (${item.selectedSize})</span>
            <span class="item-quantity">x${item.quantity}</span>
            <span class="item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = `₹${total.toFixed(2)}`;
}

function placeOrder(e) {
    e.preventDefault();
    
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        closeCheckoutModal();
        
        // Generate order number
        const orderNumber = '#' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        document.getElementById('orderNumber').textContent = orderNumber;
        document.getElementById('orderTotal').textContent = `₹${total.toFixed(2)}`;
        
        // Track order placement
        const orderData = {
            orderNumber: orderNumber,
            total: total,
            items: cartItems.map(item => ({
                name: item.name,
                price: item.price,
                image: item.images ? item.images.main : item.image,
                size: item.selectedSize || 'M',
                quantity: item.quantity
            }))
        };
        trackOrderPlacement(orderData);
        
        // Clear cart
        cartItems = [];
        updateCounters();
        
        orderSuccessModal.classList.add('active');
    }, 2000);
}

function closeOrderSuccessModal() {
    orderSuccessModal.classList.remove('active');
}

// Utility Functions
function updateCounters() {
    cartCount.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    wishlistCount.textContent = wishlistItems.length;
}

function showNotification(message) {
    document.getElementById('notificationMessage').textContent = message;
    cartNotification.classList.add('active');
    
    setTimeout(() => {
        cartNotification.classList.remove('active');
    }, 3000);
}

function closeNotification() {
    cartNotification.classList.remove('active');
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Scroll Functions
function handleScroll() {
    // Add scroll-based functionality here if needed
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Desktop view adjustments
function updateDesktopLayout() {
    if (window.innerWidth >= 768) {
        // Desktop adjustments
        document.querySelector('.nav-desktop').style.display = 'flex';
        document.querySelector('.mobile-search-btn').style.display = 'none';
        document.querySelector('.desktop-only').style.display = 'inline';
    } else {
        // Mobile adjustments
        document.querySelector('.nav-desktop').style.display = 'none';
        document.querySelector('.mobile-search-btn').style.display = 'block';
        document.querySelector('.desktop-only').style.display = 'none';
    }
}

// Responsive adjustments
window.addEventListener('resize', updateDesktopLayout);
updateDesktopLayout();

// Admin System Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Admin Elements
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminDashboardModal = document.getElementById('adminDashboardModal');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminLoginModalClose = document.getElementById('adminLoginModalClose');
    const adminDashboardClose = document.getElementById('adminDashboardClose');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminPasswordToggle = document.getElementById('adminPasswordToggle');
    
    // Add New Item Modals
    const addOrderModal = document.getElementById('addOrderModal');
    const addReturnModal = document.getElementById('addReturnModal');
    const addExchangeModal = document.getElementById('addExchangeModal');
    
    // Admin Dashboard Elements
    const adminTabs = document.querySelectorAll('.admin-tab');
    const adminTabPanes = document.querySelectorAll('.admin-tab-pane');
    
    // Real Data Storage (localStorage)
    let orders = JSON.parse(localStorage.getItem('legasus_orders')) || [];
    let returns = JSON.parse(localStorage.getItem('legasus_returns')) || [];
    let exchanges = JSON.parse(localStorage.getItem('legasus_exchanges')) || [];
    let customOrders = JSON.parse(localStorage.getItem('legasus_custom_orders')) || [];
    
    // Load products from localStorage or use existing products array
    let products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    
    // Admin Credentials
    const ADMIN_CREDENTIALS = {
        username: 'admin',
        password: 'admin123'
    };
    
    // Security: Clear any existing admin session on page load
    console.log('Admin system initialized - clearing any existing sessions for security');
    
    let isAdminLoggedIn = JSON.parse(localStorage.getItem('adminLoggedIn')) || false;
    let adminLoginTime = JSON.parse(localStorage.getItem('adminLoginTime')) || null;
    
    // Check if admin session has expired (24 hours)
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (isAdminLoggedIn && adminLoginTime) {
        const now = Date.now();
        if (now - adminLoginTime > SESSION_TIMEOUT) {
            // Session expired
            isAdminLoggedIn = false;
            localStorage.setItem('adminLoggedIn', 'false');
            localStorage.removeItem('adminLoginTime');
        }
    }
    
    // Force admin logout on page load to prevent auto-login
    // To enable auto-login (keep admin logged in between sessions), comment out the next 3 lines:
    // isAdminLoggedIn = false;
    // localStorage.setItem('adminLoggedIn', 'false');
    // localStorage.removeItem('adminLoginTime');
    
    // For security: Always require fresh login on page load
    isAdminLoggedIn = false;
    localStorage.setItem('adminLoggedIn', 'false');
    localStorage.removeItem('adminLoginTime');
    
    // Check if admin is already logged in on page load
    if (isAdminLoggedIn) {
        // Update button status for logged in admin (but don't auto-open dashboard)
        updateAdminButtonStatus();
    } else {
        // Update button status even if not logged in
        updateAdminButtonStatus();
    }
    
    // Function to update admin button appearance
    function updateAdminButtonStatus() {
        const adminBtn = document.getElementById('adminLoginBtn');
        if (adminBtn) {
            if (isAdminLoggedIn) {
                adminBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
                adminBtn.title = 'Admin Dashboard (Click to open)';
                adminBtn.onclick = openAdminDashboard;
                adminBtn.classList.add('logged-in');
                
                // Add admin status indicator to header
                addAdminStatusIndicator();
            } else {
                adminBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
                adminBtn.title = 'Admin Login';
                adminBtn.onclick = openAdminLogin;
                adminBtn.classList.remove('logged-in');
                
                // Remove admin status indicator
                removeAdminStatusIndicator();
            }
        }
    }
    
    // Add admin status indicator to header
    function addAdminStatusIndicator() {
        // Remove existing indicator if any
        removeAdminStatusIndicator();
        
        const header = document.querySelector('.header');
        if (header && !document.getElementById('adminStatusIndicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'adminStatusIndicator';
            indicator.className = 'admin-status-indicator';
            indicator.innerHTML = '<i class="fas fa-user-shield"></i> Admin Mode';
            header.appendChild(indicator);
        }
    }
    
    // Remove admin status indicator
    function removeAdminStatusIndicator() {
        const indicator = document.getElementById('adminStatusIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Save data to localStorage
    function saveData() {
        localStorage.setItem('legasus_orders', JSON.stringify(orders));
        localStorage.setItem('legasus_returns', JSON.stringify(returns));
        localStorage.setItem('legasus_exchanges', JSON.stringify(exchanges));
        localStorage.setItem('legasus_custom_orders', JSON.stringify(customOrders));
        localStorage.setItem('adminProducts', JSON.stringify(products));
    }
    
    // Open Admin Login
    function openAdminLogin() {
        adminLoginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Close Admin Login
    function closeAdminLogin() {
        adminLoginModal.classList.remove('active');
        document.body.style.overflow = '';
        adminLoginForm.reset();
    }
    
    // Open Admin Dashboard
    function openAdminDashboard() {
        adminDashboardModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadDashboardData();
        
        // Show welcome message if auto-opened
        if (isAdminLoggedIn && !document.getElementById('adminLoginModal').classList.contains('active')) {
            showNotification('Welcome back, Admin! Dashboard opened automatically.');
        }
    }
    
    // Close Admin Dashboard
    function closeAdminDashboard() {
        adminDashboardModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Admin Logout
    function adminLogout() {
        isAdminLoggedIn = false;
        localStorage.setItem('adminLoggedIn', 'false');
        localStorage.removeItem('adminLoginTime');
        
        // Remove isAdmin flag and currentUser for admin-dashboard.html access check
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('currentUser');
        
        closeAdminDashboard();
        updateAdminButtonStatus();
        showNotification('Admin logged out successfully');
    }
    
    // Function to force clear admin session (for debugging/security)
    function forceClearAdminSession() {
        isAdminLoggedIn = false;
        localStorage.setItem('adminLoggedIn', 'false');
        localStorage.removeItem('adminLoginTime');
        
        // Remove isAdmin flag and currentUser for admin-dashboard.html access check
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('currentUser');
        
        updateAdminButtonStatus();
        console.log('Admin session forcefully cleared');
    }
    
    // Call this function to ensure clean state
    forceClearAdminSession();
    
    // Handle Admin Login
    function handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            isAdminLoggedIn = true;
            const loginTime = Date.now();
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminLoginTime', loginTime.toString());
            
            // Set isAdmin flag for admin-dashboard.html access check
            localStorage.setItem('isAdmin', 'true');
            
            // Set currentUser with isAdmin flag
            const adminUser = {
                username: username,
                isAdmin: true
            };
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            
            closeAdminLogin();
            openAdminDashboard();
            updateAdminButtonStatus();
            showNotification('Admin login successful!');
        } else {
            showNotification('Invalid admin credentials!');
        }
    }
    
    // Load Dashboard Data
    function loadDashboardData() {
        // Update stats
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalEarnings').textContent = '₹' + orders.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2);
        document.getElementById('totalCustomers').textContent = new Set(orders.map(order => order.customer)).size;
        document.getElementById('totalProducts').textContent = '45'; // Mock data
        
        // Update earnings
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const netProfit = totalRevenue * 0.4; // 40% profit margin
        
        document.getElementById('totalRevenue').textContent = '₹' + totalRevenue.toFixed(2);
        document.getElementById('netProfit').textContent = '₹' + netProfit.toFixed(2);
        document.getElementById('periodOrders').textContent = orders.length;
        document.getElementById('avgOrderValue').textContent = '₹' + (totalRevenue / Math.max(orders.length, 1)).toFixed(2);
        
        // Load recent activity
        loadRecentActivity();
        
        // Load orders table
        loadOrdersTable();
        
        // Load custom orders
        loadCustomOrders();
        
        // Load returns table
        loadReturnsTable();
        
        // Load exchanges table
        loadExchangesTable();
        
        // Load products grid
        loadProductsGrid();
    }
    
    // Load Recent Activity
    function loadRecentActivity() {
        const activityList = document.getElementById('recentActivityList');
        const recentOrders = orders.slice(-3).reverse();
        const recentReturns = returns.slice(-2).reverse();
        const recentExchanges = exchanges.slice(-2).reverse();
        
        let activities = [];
        
        // Add recent orders
        recentOrders.forEach(order => {
            activities.push({
                icon: 'fas fa-shopping-cart',
                title: 'New Order',
                description: `Order ${order.id} placed by ${order.customer}`,
                time: order.date
            });
        });
        
        // Add recent returns
        recentReturns.forEach(ret => {
            activities.push({
                icon: 'fas fa-undo',
                title: 'Return Request',
                description: `Return ${ret.id} for ${ret.product}`,
                time: ret.date || 'Today'
            });
        });
        
        // Add recent exchanges
        recentExchanges.forEach(exc => {
            activities.push({
                icon: 'fas fa-exchange-alt',
                title: 'Exchange Request',
                description: `Exchange ${exc.id} for ${exc.originalProduct}`,
                time: exc.date || 'Today'
            });
        });
        
        // Sort by date and take latest 5
        activities = activities.slice(0, 5);
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-details">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <small>${activity.time}</small>
                </div>
            </div>
        `).join('');
    }
    
    // Load Orders Table
    function loadOrdersTable() {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.products}</td>
                <td>₹${order.total}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${order.date}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrder('${order.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="editOrder('${order.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Load Custom Orders
    function loadCustomOrders() {
        const grid = document.getElementById('customOrdersGrid');
        if (customOrders.length === 0) {
            grid.innerHTML = '<p>No custom orders yet.</p>';
            return;
        }
        
        grid.innerHTML = customOrders.map(order => `
            <div class="custom-order-card">
                <img src="${order.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNyZWF0aXZlIENvbW1vbnM8L3RleHQ+PC9zdmc+'}" alt="${order.product}" class="custom-order-photo">
                <h4>${order.product}</h4>
                <div class="custom-order-details">
                    <p><strong>Customer:</strong> ${order.customer}</p>
                    <p><strong>Fabric:</strong> ${order.fabric}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
                </div>
                <div class="custom-order-actions">
                    <button class="btn btn-sm btn-primary">View Details</button>
                    <button class="btn btn-sm btn-success">Approve</button>
                    <button class="btn btn-sm btn-danger">Reject</button>
                </div>
            </div>
        `).join('');
    }
    
    // Load Returns Table
    function loadReturnsTable() {
        const tbody = document.getElementById('returnsTableBody');
        tbody.innerHTML = returns.map(ret => `
            <tr>
                <td>${ret.id}</td>
                <td>${ret.orderId}</td>
                <td>${ret.customer}</td>
                <td>${ret.product}</td>
                <td>${ret.reason}</td>
                <td><span class="status-badge status-${ret.status}">${ret.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary">View</button>
                    <button class="btn btn-sm btn-success">Approve</button>
                    <button class="btn btn-sm btn-danger">Reject</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Load Exchanges Table
    function loadExchangesTable() {
        const tbody = document.getElementById('exchangesTableBody');
        tbody.innerHTML = exchanges.map(exc => `
            <tr>
                <td>${exc.id}</td>
                <td>${exc.orderId}</td>
                <td>${exc.customer}</td>
                <td>${exc.originalProduct}</td>
                <td>${exc.newProduct}</td>
                <td><span class="status-badge status-${exc.status}">${exc.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary">View</button>
                    <button class="btn btn-sm btn-success">Approve</button>
                    <button class="btn btn-sm btn-danger">Reject</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Add New Order
    function addNewOrder(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const orderData = {};
        
        for (let [key, value] of formData.entries()) {
            orderData[key] = value;
        }
        
        // Generate order ID
        orderData.id = 'ORD' + (orders.length + 1).toString().padStart(3, '0');
        orderData.date = orderData.date || new Date().toISOString().split('T')[0];
        
        orders.push(orderData);
        saveData();
        
        // Close modal and refresh
        addOrderModal.classList.remove('active');
        e.target.reset();
        loadDashboardData();
        showNotification('New order added successfully!');
    }
    
    // Add New Return
    function addNewReturn(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const returnData = {};
        
        for (let [key, value] of formData.entries()) {
            returnData[key] = value;
        }
        
        // Generate return ID
        returnData.id = 'RET' + (returns.length + 1).toString().padStart(3, '0');
        returnData.date = new Date().toISOString().split('T')[0];
        
        returns.push(returnData);
        saveData();
        
        // Close modal and refresh
        addReturnModal.classList.remove('active');
        e.target.reset();
        loadDashboardData();
        showNotification('New return added successfully!');
    }
    
    // Add New Exchange
    function addNewExchange(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const exchangeData = {};
        
        for (let [key, value] of formData.entries()) {
            exchangeData[key] = value;
        }
        
        // Generate exchange ID
        exchangeData.id = 'EXC' + (exchanges.length + 1).toString().padStart(3, '0');
        exchangeData.date = new Date().toISOString().split('T')[0];
        
        exchanges.push(exchangeData);
        saveData();
        
        // Close modal and refresh
        addExchangeModal.classList.remove('active');
        e.target.reset();
        loadDashboardData();
        showNotification('New exchange added successfully!');
    }
    
    // Tab Switching
    function switchTab(tabName) {
        adminTabs.forEach(tab => tab.classList.remove('active'));
        adminTabPanes.forEach(pane => pane.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
    
    // Event Listeners
    adminLoginBtn.addEventListener('click', openAdminLogin);
    adminLoginModalClose.addEventListener('click', closeAdminLogin);
    adminDashboardClose.addEventListener('click', closeAdminDashboard);
    adminLogoutBtn.addEventListener('click', adminLogout);
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    
    // Add new item buttons
    document.getElementById('addNewOrderBtn')?.addEventListener('click', () => {
        addOrderModal.classList.add('active');
        document.getElementById('newOrderDate').value = new Date().toISOString().split('T')[0];
    });
    
    document.getElementById('addNewReturnBtn')?.addEventListener('click', () => {
        addReturnModal.classList.add('active');
    });
    
    document.getElementById('addNewExchangeBtn')?.addEventListener('click', () => {
        addExchangeModal.classList.add('active');
    });
    
    // Form submissions
    document.getElementById('addOrderForm')?.addEventListener('submit', addNewOrder);
    document.getElementById('addReturnForm')?.addEventListener('submit', addNewReturn);
    document.getElementById('addExchangeForm')?.addEventListener('submit', addNewExchange);
    
    // Close modals
    document.getElementById('addOrderModalClose')?.addEventListener('click', () => {
        addOrderModal.classList.remove('active');
    });
    
    document.getElementById('addReturnModalClose')?.addEventListener('click', () => {
        addReturnModal.classList.remove('active');
    });
    
    document.getElementById('addExchangeModalClose')?.addEventListener('click', () => {
        addExchangeModal.classList.remove('active');
    });
    
    // Cancel buttons
    document.getElementById('cancelAddOrder')?.addEventListener('click', () => {
        addOrderModal.classList.remove('active');
        document.getElementById('addOrderForm').reset();
    });
    
    document.getElementById('cancelAddReturn')?.addEventListener('click', () => {
        addReturnModal.classList.remove('active');
        document.getElementById('addReturnForm').reset();
    });
    
    document.getElementById('cancelAddExchange')?.addEventListener('click', () => {
        addExchangeModal.classList.remove('active');
        document.getElementById('addExchangeForm').reset();
    });
    
    // Admin password toggle
    adminPasswordToggle.addEventListener('click', function() {
        const passwordInput = document.getElementById('adminPassword');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });
    
    // Tab switching
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Close submenu if it's open and switching to a different tab
            if (submenu && submenu.classList.contains('active') && tabName !== 'orders') {
                submenu.classList.remove('active');
                const chevron = ordersTab?.querySelector('.submenu-toggle');
                if (chevron) {
                    chevron.style.transform = '';
                }
            }
            
            switchTab(tabName);
        });
    });
    
    // Submenu functionality
    const ordersTab = document.querySelector('[data-tab="orders"]');
    const submenu = document.querySelector('.admin-submenu');
    const submenuTabs = document.querySelectorAll('.admin-subtab');
    
    if (ordersTab && submenu) {
        ordersTab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle submenu
            submenu.classList.toggle('active');
            
            // Toggle chevron rotation
            const chevron = this.querySelector('.submenu-toggle');
            if (chevron) {
                chevron.style.transform = submenu.classList.contains('active') ? 'rotate(180deg)' : '';
            }
        });
        
        // Add keyboard support for accessibility
        ordersTab.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                submenu.classList.toggle('active');
                
                const chevron = this.querySelector('.submenu-toggle');
                if (chevron) {
                    chevron.style.transform = submenu.classList.contains('active') ? 'rotate(180deg)' : '';
                }
            }
        });
    }
    
    // Handle submenu tab clicks
    submenuTabs.forEach(subtab => {
        subtab.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const tabName = this.getAttribute('data-tab');
            
            // Close submenu
            submenu.classList.remove('active');
            
            // Reset chevron rotation
            const chevron = ordersTab.querySelector('.submenu-toggle');
            if (chevron) {
                chevron.style.transform = '';
            }
            
            // Switch to the selected tab
            switchTab(tabName);
            
            // Update active states
            submenuTabs.forEach(st => st.classList.remove('active'));
            this.classList.add('active');
            
            // Also activate the main orders tab
            adminTabs.forEach(tab => tab.classList.remove('active'));
            ordersTab.classList.add('active');
        });
        
        // Add keyboard support for accessibility
        subtab.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                
                const tabName = this.getAttribute('data-tab');
                
                // Close submenu
                submenu.classList.remove('active');
                
                // Reset chevron rotation
                const chevron = ordersTab.querySelector('.submenu-toggle');
                if (chevron) {
                    chevron.style.transform = '';
                }
                
                // Switch to the selected tab
                switchTab(tabName);
                
                // Update active states
                submenuTabs.forEach(st => st.classList.remove('active'));
                this.classList.add('active');
                
                // Also activate the main orders tab
                adminTabs.forEach(tab => tab.classList.remove('active'));
                ordersTab.classList.add('active');
            }
        });
    });
    
    // Close modals when clicking outside
    adminLoginModal.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) {
            closeAdminLogin();
        }
    });
    
    adminDashboardModal.addEventListener('click', (e) => {
        if (e.target === adminDashboardModal) {
            closeAdminDashboard();
        }
    });
    
    // Close submenu when clicking outside
    document.addEventListener('click', function(e) {
        if (!ordersTab?.contains(e.target) && !submenu?.contains(e.target)) {
            submenu?.classList.remove('active');
            const chevron = ordersTab?.querySelector('.submenu-toggle');
            if (chevron) {
                chevron.style.transform = '';
            }
        }
    });
    
    addOrderModal.addEventListener('click', (e) => {
        if (e.target === addOrderModal) {
            addOrderModal.classList.remove('active');
        }
    });
    
    addReturnModal.addEventListener('click', (e) => {
        if (e.target === addReturnModal) {
            addReturnModal.classList.remove('active');
        }
    });
    
    addExchangeModal.addEventListener('click', (e) => {
        if (e.target === addExchangeModal) {
            addExchangeModal.classList.remove('active');
        }
    });
    
    // Search and filter functionality
    document.getElementById('orderSearch')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#ordersTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // Status filter functionality
    document.getElementById('orderStatusFilter')?.addEventListener('change', function() {
        const status = this.value;
        const rows = document.querySelectorAll('#ordersTableBody tr');
        
        rows.forEach(row => {
            if (!status || row.querySelector('.status-badge').textContent === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Add status badge styles
    const style = document.createElement('style');
    style.textContent = `
        .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: capitalize;
        }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-processing { background: #cce5ff; color: #004085; }
        .status-shipped { background: #d1ecf1; color: #0c5460; }
        .status-delivered { background: #d4edda; color: #155724; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        .status-reviewing { background: #e2e3e5; color: #383d41; }
        .status-approved { background: #d4edda; color: #155724; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-processed { background: #d1ecf1; color: #0c5460; }
        
        .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
            margin: 0.1rem;
        }
    `;
    document.head.appendChild(style);
    
    // Global functions for order management
    window.viewOrder = function(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            showNotification(`Viewing order: ${order.id} - ${order.customer}`);
        }
    };
    
    window.editOrder = function(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            showNotification(`Editing order: ${order.id}`);
            // You can implement edit functionality here
        }
    };
    
    window.deleteOrder = function(orderId) {
        if (confirm('Are you sure you want to delete this order?')) {
            orders = orders.filter(o => o.id !== orderId);
            saveData();
            loadDashboardData();
            showNotification('Order deleted successfully!');
        }
    };
});

// Product Management
const addProductModal = document.getElementById('addProductModal');
const addProductModalClose = document.getElementById('addProductModalClose');
const addProductForm = document.getElementById('addProductForm');
const addNewProductBtn = document.getElementById('addNewProductBtn');
const cancelAddProductBtn = document.getElementById('cancelAddProduct');

// Image upload areas
const mainImageArea = document.getElementById('mainImageArea');
const image1Area = document.getElementById('image1Area');
const image2Area = document.getElementById('image2Area');
const image3Area = document.getElementById('image3Area');

// Image previews
const mainImagePreview = document.getElementById('mainImagePreview');
const image1Preview = document.getElementById('image1Preview');
const image2Preview = document.getElementById('image2Preview');
const image3Preview = document.getElementById('image3Preview');

// File inputs
const mainImageInput = document.getElementById('mainImage');
const image1Input = document.getElementById('image1');
const image2Input = document.getElementById('image2');
const image3Input = document.getElementById('image3');

// Open Add Product Modal
function openAddProductModal() {
    addProductModal.classList.add('active');
}

// Close Add Product Modal
function closeAddProductModal() {
    addProductModal.classList.remove('active');
    addProductForm.reset();
    resetImagePreviews();
}

// Reset image previews
function resetImagePreviews() {
    mainImagePreview.style.display = 'none';
    image1Preview.style.display = 'none';
    image2Preview.style.display = 'none';
    image3Preview.style.display = 'none';
    
    mainImageArea.querySelector('.upload-placeholder').style.display = 'flex';
    image1Area.querySelector('.upload-placeholder').style.display = 'flex';
    image2Area.querySelector('.upload-placeholder').style.display = 'flex';
    image3Area.querySelector('.upload-placeholder').style.display = 'flex';
}

// Handle image upload
function handleImageUpload(file, previewElement, placeholderElement) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
            placeholderElement.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Handle product form submission
function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(addProductForm);
    
    // Get selected sizes
    const selectedSizes = [];
    const sizeCheckboxes = addProductForm.querySelectorAll('input[name="sizes"]:checked');
    sizeCheckboxes.forEach(checkbox => {
        selectedSizes.push(checkbox.value);
    });
    
    // Create product object
    const newProduct = {
        id: Date.now(), // Simple ID generation
        name: formData.get('productName'),
        category: formData.get('productCategory'),
        price: parseFloat(formData.get('productPrice')),
        stock: parseInt(formData.get('productStock')) || 0,
        description: formData.get('productDescription'),
        sizes: selectedSizes,
        images: {
            main: mainImagePreview.src || '',
            additional: [
                image1Preview.src || '',
                image2Preview.src || '',
                image3Preview.src || ''
            ].filter(src => src !== '')
        },
        createdAt: new Date().toISOString()
    };
    
    // Add to products array
    products.push(newProduct);
    
    // Save to localStorage
    localStorage.setItem('adminProducts', JSON.stringify(products));
    
    // Close modal and show success message
    closeAddProductModal();
    showNotification('Product added successfully!');
    
    // Refresh products display if on products tab
    if (document.querySelector('.products-tab.active')) {
        loadProductsGrid();
    }
    
    // Refresh main page products
    renderProducts();
    
    // Also refresh latest collection and best sellers if they're visible
    if (document.querySelector('.latest-collection').style.display !== 'none') {
        renderLatestCollection();
    }
    if (document.querySelector('.best-sellers').style.display !== 'none') {
        renderBestSellers();
    }
}

// Load products grid in admin
function loadProductsGrid() {
    const productsGrid = document.getElementById('adminProductsGrid');
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-data">No products added yet. Click "Add New Product" to get started!</p>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.images ? product.images.main : 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${product.name}" class="product-image">
            <div class="product-details">
                <h4>${product.name}</h4>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Price:</strong> ₹${product.price}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>
                <p><strong>Sizes:</strong> ${product.sizes.join(', ')}</p>
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary btn-sm" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Edit product (placeholder)
function editProduct(productId) {
    showNotification('Edit functionality coming soon!');
}

// Delete product
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('adminProducts', JSON.stringify(products));
        loadProductsGrid();
        
        // Refresh main page products
        renderProducts();
        
        // Also refresh latest collection and best sellers if they're visible
        if (document.querySelector('.latest-collection').style.display !== 'none') {
            renderLatestCollection();
        }
        if (document.querySelector('.best-sellers').style.display !== 'none') {
            renderBestSellers();
        }
        
        showNotification('Product deleted successfully!');
    }
}

// Event Listeners for Product Management
addNewProductBtn.addEventListener('click', openAddProductModal);
addProductModalClose.addEventListener('click', closeAddProductModal);
cancelAddProductBtn.addEventListener('click', closeAddProductModal);
addProductForm.addEventListener('submit', handleAddProduct);

// Image upload event listeners
mainImageArea.addEventListener('click', () => mainImageInput.click());
image1Area.addEventListener('click', () => image1Input.click());
image2Area.addEventListener('click', () => image2Input.click());
image3Area.addEventListener('click', () => image3Input.click());

// Handle file selection
mainImageInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleImageUpload(e.target.files[0], mainImagePreview, mainImageArea.querySelector('.upload-placeholder'));
    }
});

image1Input.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleImageUpload(e.target.files[0], image1Preview, image1Area.querySelector('.upload-placeholder'));
    }
});

image2Input.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleImageUpload(e.target.files[0], image2Preview, image2Area.querySelector('.upload-placeholder'));
    }
});

image3Input.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleImageUpload(e.target.files[0], image3Preview, image3Area.querySelector('.upload-placeholder'));
    }
});

// Close modal when clicking outside
addProductModal.addEventListener('click', (e) => {
    if (e.target === addProductModal) {
        closeAddProductModal();
    }
});




