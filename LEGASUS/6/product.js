/// Global variables
let currentProduct = null;
let allProducts = [];
let cartItems = [];
let selectedSize = 'M';
let selectedQuantity = 1;

// DOM Elements
const productTitle = document.getElementById('productTitle');
const productPrice = document.getElementById('productPrice');
const productDescription = document.getElementById('productDescription');
const productCare = document.getElementById('productCare');
const mainProductImage = document.getElementById('mainProductImage');
const thumbsContainer = document.getElementById('thumbs');
const sizeOptions = document.getElementById('sizeOptions');
const quantitySelect = document.getElementById('quantitySelect');
const addToCartBtn = document.getElementById('addToCartBtn');
const buyNowBtn = document.getElementById('buyNowBtn');
const recommendedProducts = document.getElementById('recommendedProducts');
const breadcrumbCategory = document.getElementById('breadcrumbCategory');
const breadcrumbProduct = document.getElementById('breadcrumbProduct');
const cartCount = document.getElementById('cartCount');
const cartNotification = document.getElementById('cartNotification');
const loadingOverlay = document.getElementById('loadingOverlay');

// Modal Elements
const loginModal = document.getElementById('loginModal');
const checkoutModal = document.getElementById('checkoutModal');
const orderSuccessModal = document.getElementById('orderSuccessModal');
const cartModal = document.getElementById('cartModal');

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    await loadProductData();
    setupEventListeners();
    loadCartFromStorage();
    updateCounters();
});

// Load product data from localStorage or URL
async function loadProductData() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    // Try to get product from localStorage first
    const storedProduct = localStorage.getItem('selectedProduct');
    const storedAllProducts = localStorage.getItem('allProducts');
    
    if (storedProduct && storedAllProducts) {
        try {
            currentProduct = JSON.parse(storedProduct);
            allProducts = JSON.parse(storedAllProducts);
            displayProduct(currentProduct);
            displayRecommendedProducts();
        } catch (error) {
            // Fall back to default products
            await loadDefaultProducts();
            if (productId) {
                currentProduct = allProducts.find(p => p.id == productId);
            }
            if (currentProduct) {
                displayProduct(currentProduct);
                displayRecommendedProducts();
            }
        }
    } else if (productId) {
        // Fallback: try to find product by ID in a default product list
        await loadDefaultProducts();
        currentProduct = allProducts.find(p => p.id == productId);
        if (currentProduct) {
            displayProduct(currentProduct);
            displayRecommendedProducts();
        } else {
            showError('Product not found');
        }
    } else {
        // If no product ID, load default products and show the first one
        await loadDefaultProducts();
        if (allProducts.length > 0) {
            currentProduct = allProducts[0];
            displayProduct(currentProduct);
            displayRecommendedProducts();
        } else {
            showError('No products available');
        }
    }
    
    // Ensure currentProduct is set
    if (!currentProduct) {
        showError('No product available');
        return;
    }
}

// Load default products if no data in localStorage
async function loadDefaultProducts() {
    allProducts = [
        {
            id: 1,
            name: "Velocity Racing Tee",
            price: 49.99,
            image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800",
            category: "men",
            season: "summer",
            description: "High-performance racing tee made with moisture-wicking fabric. Perfect for athletic activities and casual wear.",
            sizes: ["XS", "S", "M", "L", "XL"],
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
            sizes: ["S", "M", "L", "XL"],
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
            sizes: ["S", "M", "L", "XL"],
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
        }
    ];
}

// Display product details
function displayProduct(product) {
    if (!product) return;
    
    // Update page title
    document.title = `${product.name} - LEGASUS`;
    
    // Update breadcrumb
    breadcrumbCategory.textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
    breadcrumbProduct.textContent = product.name;
    
    // Update product details
    productTitle.innerHTML = `<span class="accent">${product.name.split(' ')[0]}</span> ${product.name.split(' ').slice(1).join(' ')}`;
    productPrice.textContent = `₹${product.price}`;
    productDescription.textContent = product.description;
    productCare.textContent = `Material: ${product.material}. Care: ${product.care}`;
    
    // Update main image
    mainProductImage.src = product.image;
    mainProductImage.alt = product.name;
    
    // Generate thumbnails (using same image for demo)
    thumbsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const thumb = document.createElement('button');
        thumb.className = `thumb ${i === 0 ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
        thumb.addEventListener('click', () => selectThumbnail(thumb, product.image));
        thumbsContainer.appendChild(thumb);
    }
    
    // Update size options
    displaySizeOptions(product.sizes);
}

// Display size options
function displaySizeOptions(sizes) {
    sizeOptions.innerHTML = '';
    sizes.forEach(size => {
        const sizeBtn = document.createElement('button');
        sizeBtn.className = `size ${size === selectedSize ? 'active' : ''}`;
        sizeBtn.textContent = size;
        sizeBtn.addEventListener('click', () => selectSize(size));
        sizeOptions.appendChild(sizeBtn);
    });
}

// Select size
function selectSize(size) {
    selectedSize = size;
    
    document.querySelectorAll('.size').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === size) {
            btn.classList.add('active');
        }
    });
}

// Select thumbnail
function selectThumbnail(thumb, imageSrc) {
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    mainProductImage.src = imageSrc;
}

// Display recommended products
function displayRecommendedProducts() {
    if (!currentProduct || allProducts.length === 0) return;
    
    // Get 4 random products excluding current product
    const otherProducts = allProducts.filter(p => p.id !== currentProduct.id);
    const shuffled = otherProducts.sort(() => 0.5 - Math.random());
    const recommended = shuffled.slice(0, 4);
    
    recommendedProducts.innerHTML = recommended.map(product => `
        <div class="rec-card" onclick="navigateToProduct(${product.id})">
            <img src="${product.image}" alt="${product.name}">
            <div class="rec-name">${product.name}</div>
            <div class="rec-price">₹${product.price}</div>
        </div>
    `).join('');
}

// Navigate to another product
function navigateToProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        localStorage.setItem('selectedProduct', JSON.stringify(product));
        localStorage.setItem('allProducts', JSON.stringify(allProducts));
        window.location.href = `product.html?id=${productId}`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Size selection
    document.querySelectorAll('.size').forEach(btn => {
        btn.addEventListener('click', () => selectSize(btn.textContent));
    });
    
    // Quantity selection
    quantitySelect.addEventListener('change', (e) => {
        selectedQuantity = parseInt(e.target.value);
    });
    
    // Add to cart
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCart);
    }
    
    // Buy now
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', buyNow);
    }
    
    // Accordion functionality
    document.querySelectorAll('.acc-title').forEach(title => {
        title.addEventListener('click', () => toggleAccordion(title));
    });
    
    // Cart button - don't redirect, just show cart items
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCartModal);
    }
    
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }
    
    // Modal event listeners
    setupModalEventListeners();
    
    // Notification close
    const notificationClose = document.getElementById('notificationClose');
    if (notificationClose) {
        notificationClose.addEventListener('click', closeNotification);
    }
    
    // Subscribe form
    window.handleSubscribe = function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        showNotification(`Thank you for subscribing with ${email}!`);
        document.getElementById('email').value = '';
    };
}

// Toggle accordion
function toggleAccordion(title) {
    const body = title.nextElementSibling;
    const plus = title.querySelector('.plus');
    
    // Close all other accordions
    document.querySelectorAll('.acc-body').forEach(b => {
        if (b !== body) {
            b.classList.remove('active');
        }
    });
    document.querySelectorAll('.acc-title').forEach(t => {
        if (t !== title) {
            t.classList.remove('active');
        }
    });
    
    // Toggle current accordion
    const isActive = body.classList.contains('active');
    body.classList.toggle('active', !isActive);
    title.classList.toggle('active', !isActive);
}

// Add to cart
function addToCart() {
    if (!currentProduct) {
        showNotification('Error: No product available');
        return;
    }
    
    const existingItem = cartItems.find(item => 
        item.id === currentProduct.id && item.selectedSize === selectedSize
    );
    
    if (existingItem) {
        existingItem.quantity += selectedQuantity;
    } else {
        const newItem = {
            ...currentProduct,
            selectedSize: selectedSize,
            quantity: selectedQuantity
        };
        cartItems.push(newItem);
    }
    
    saveCartToStorage();
    updateCounters();
    showNotification(`${currentProduct.name} (${selectedSize}) added to cart!`);
    
    // Update button temporarily
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = '<i class="fas fa-check"></i> ADDED';
    addToCartBtn.disabled = true;
    
    setTimeout(() => {
        addToCartBtn.innerHTML = originalText;
        addToCartBtn.disabled = false;
    }, 2000);
}

// Buy now
function buyNow() {
    if (!currentProduct) return;
    openCheckoutModal();
}

// Storage functions
function saveCartToStorage() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

function loadCartFromStorage() {
    const stored = localStorage.getItem('cartItems');
    if (stored) {
        cartItems = JSON.parse(stored);
    }
}

// Update counters
function updateCounters() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('cartNotification');
    const messageElement = document.getElementById('notificationMessage');
    
    if (notification && messageElement) {
        messageElement.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    } else {
        // Fallback: use alert if notification system is not available
        alert(message);
    }
}

// Close notification
function closeNotification() {
    const notification = document.getElementById('cartNotification');
    if (notification) {
        notification.classList.remove('show');
    }
}

// Show error
function showError(message) {
    if (productTitle) {
        productTitle.textContent = 'Product Not Found';
    }
    if (productDescription) {
        productDescription.textContent = message;
    }
}

// Modal Functions
function setupModalEventListeners() {
    // Login Modal
    document.getElementById('loginModalClose').addEventListener('click', closeLoginModal);
    
    // Cart Modal
    const cartModalClose = document.getElementById('cartModalClose');
    if (cartModalClose) {
        cartModalClose.addEventListener('click', closeCartModal);
    }
    
    // Cart Modal Actions
    const continueShopping = document.getElementById('continueShopping');
    if (continueShopping) {
        continueShopping.addEventListener('click', closeCartModal);
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            closeCartModal();
            openCheckoutModal();
        });
    }
    
    const continueShoppingFooter = document.getElementById('continueShoppingFooter');
    if (continueShoppingFooter) {
        continueShoppingFooter.addEventListener('click', closeCartModal);
    }
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabType = e.target.getAttribute('data-tab');
            switchAuthTab(tabType);
        });
    });
    
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Checkout Modal
    document.getElementById('checkoutModalClose').addEventListener('click', closeCheckoutModal);
    document.getElementById('cancelCheckout').addEventListener('click', closeCheckoutModal);
    document.getElementById('completeOrder').addEventListener('click', completeOrder);
    
    // Order Success Modal
    document.getElementById('continueShoppingBtn').addEventListener('click', () => {
        closeOrderSuccessModal();
        window.location.href = 'index.html';
    });
    
    // Close modals on outside click
    [loginModal, checkoutModal, orderSuccessModal, cartModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeAllModals();
                }
            });
        }
    });
}

function openLoginModal() {
    loginModal.classList.add('active');
}

function closeLoginModal() {
    loginModal.classList.remove('active');
}

function openCheckoutModal() {
    if (!currentProduct) return;
    
    // Populate checkout with current product
    const checkoutItem = document.getElementById('checkoutItem');
    const totalPrice = currentProduct.price * selectedQuantity;
    
    checkoutItem.innerHTML = `
        <img src="${currentProduct.image}" alt="${currentProduct.name}">
        <div class="order-item-info">
            <div class="order-item-name">${currentProduct.name}</div>
            <div class="order-item-details">Size: ${selectedSize} | Qty: ${selectedQuantity}</div>
        </div>
        <div class="order-item-price">₹${totalPrice.toFixed(2)}</div>
    `;
    
    document.getElementById('subtotal').textContent = `₹${totalPrice.toFixed(2)}`;
    document.getElementById('finalTotal').textContent = `₹${totalPrice.toFixed(2)}`;
    
    checkoutModal.classList.add('active');
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('active');
}

function openOrderSuccessModal() {
    // Generate random order ID
    const orderId = '#LEGASUS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    document.getElementById('orderId').textContent = orderId;
    
    orderSuccessModal.classList.add('active');
}

function closeOrderSuccessModal() {
    orderSuccessModal.classList.remove('active');
}

function closeAllModals() {
    loginModal.classList.remove('active');
    checkoutModal.classList.remove('active');
    orderSuccessModal.classList.remove('active');
    if (cartModal) cartModal.style.display = 'none';
}

function openCartModal() {
    updateCartDisplay();
    cartModal.style.display = 'block';
}

function closeCartModal() {
    cartModal.style.display = 'none';
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

function updateCartItemQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const item = cartItems.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCartToStorage();
        updateCounters();
        updateCartDisplay();
    }
}

function removeFromCart(productId) {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCounters();
    updateCartDisplay();
    showNotification('Item removed from cart');
}

function switchAuthTab(tabType) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabType) {
            tab.classList.add('active');
        }
    });
    
    // Update forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (tabType === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
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

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!');
        return;
    }
    
    // Simulate signup process
    showNotification(`Welcome ${name}! Account created successfully.`);
    closeLoginModal();
    
    // Clear form
    document.getElementById('signupForm').reset();
}

function completeOrder() {
    // Validate form
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get selected payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // Simulate order processing
    closeCheckoutModal();
    
    // Add to cart for record keeping
    addToCart();
    
    // Show success modal
    setTimeout(() => {
        openOrderSuccessModal();
    }, 500);
    
    // Clear form
    form.reset();
}


