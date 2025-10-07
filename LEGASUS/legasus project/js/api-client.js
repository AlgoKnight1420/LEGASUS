/**
 * API Client for Legasus E-commerce
 * This file provides functions to interact with the backend API
 */

// API Base URL - Change this to your server URL when deployed
const API_BASE_URL = 'http://localhost:8080';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} - Response data
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }
    
    return responseData;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Products API
const productsApi = {
  /**
   * Get all products
   * @returns {Promise<Array>} - List of products
   */
  getAllProducts: () => apiRequest('/products'),
  
  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - Product data
   */
  getProductById: (id) => apiRequest(`/products/${id}`),
  
  /**
   * Create a new product (Admin only)
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} - Created product
   */
  createProduct: (productData) => apiRequest('/products', 'POST', productData),
  
  /**
   * Update a product (Admin only)
   * @param {string} id - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} - Updated product
   */
  updateProduct: (id, productData) => apiRequest(`/products/${id}`, 'PUT', productData),
  
  /**
   * Delete a product (Admin only)
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - Response message
   */
  deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE'),
  
  /**
   * Update product stock status (Admin only)
   * @param {string} id - Product ID
   * @param {string} stockStatus - Stock status ('in_stock' or 'out_of_stock')
   * @returns {Promise<Object>} - Updated product
   */
  updateProductStock: (id, stockStatus) => apiRequest(`/products/${id}/stock`, 'PATCH', { stockStatus })
};

// Users API
const usersApi = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registered user data
   */
  register: (userData) => apiRequest('/users/register', 'POST', userData),
  
  /**
   * Login user
   * @param {Object} credentials - User login credentials
   * @returns {Promise<Object>} - User data and message
   */
  login: (credentials) => apiRequest('/users/login', 'POST', credentials),
  
  /**
   * Get user profile
   * @param {string} id - User ID
   * @returns {Promise<Object>} - User profile data
   */
  getProfile: (id) => apiRequest(`/users/${id}`),
  
  /**
   * Update user profile
   * @param {string} id - User ID
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} - Updated user profile
   */
  updateProfile: (id, profileData) => apiRequest(`/users/${id}`, 'PUT', profileData)
};

// Orders API
const ordersApi = {
  /**
   * Get all orders (Admin only)
   * @returns {Promise<Array>} - List of orders
   */
  getAllOrders: () => apiRequest('/orders'),
  
  /**
   * Get order by ID
   * @param {string} id - Order ID
   * @returns {Promise<Object>} - Order data
   */
  getOrderById: (id) => apiRequest(`/orders/${id}`),
  
  /**
   * Get orders by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of user orders
   */
  getUserOrders: (userId) => apiRequest(`/orders/user/${userId}`),
  
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} - Created order
   */
  createOrder: (orderData) => apiRequest('/orders', 'POST', orderData),
  
  /**
   * Update order status (Admin only)
   * @param {string} id - Order ID
   * @param {string} status - Order status
   * @returns {Promise<Object>} - Updated order
   */
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}/status`, 'PATCH', { status })
};

// Payments API
const paymentsApi = {
  /**
   * Create a Razorpay order
   * @param {Object} orderData - Order data with amount
   * @returns {Promise<Object>} - Razorpay order details
   */
  createRazorpayOrder: (orderData) => apiRequest('/payments/create-order', 'POST', orderData),
  
  /**
   * Verify Razorpay payment
   * @param {Object} paymentData - Payment verification data
   * @returns {Promise<Object>} - Verification result
   */
  verifyPayment: (paymentData) => apiRequest('/payments/verify', 'POST', paymentData),
  
  /**
   * Get payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} - Payment details
   */
  getPaymentDetails: (paymentId) => apiRequest(`/payments/${paymentId}`),
  
  /**
   * Refund payment (Admin only)
   * @param {string} paymentId - Razorpay payment ID
   * @param {Object} refundData - Refund data with amount
   * @returns {Promise<Object>} - Refund details
   */
  refundPayment: (paymentId, refundData) => apiRequest(`/payments/${paymentId}/refund`, 'POST', refundData)
};

// Export all API functions
const api = {
  products: productsApi,
  users: usersApi,
  orders: ordersApi,
  payments: paymentsApi
};

// Make API available globally
window.api = api;