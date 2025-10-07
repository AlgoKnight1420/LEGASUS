const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');

// Initialize Razorpay with your key_id and key_secret
// These should be stored in environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a new order in Razorpay
 * @param {number} amount - Amount in paise (Rs 100 = 10000 paise)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} receipt - Receipt ID (optional)
 * @returns {Promise<Object>} - Razorpay order object
 */
async function createOrder(amount, currency = 'INR', receipt = null) {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${uuidv4()}`,
      payment_capture: 1 // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentDetails - Payment details from client
 * @param {string} paymentDetails.razorpay_order_id - Razorpay order ID
 * @param {string} paymentDetails.razorpay_payment_id - Razorpay payment ID
 * @param {string} paymentDetails.razorpay_signature - Razorpay signature
 * @returns {boolean} - True if signature is valid
 */
function verifyPaymentSignature(paymentDetails) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
    
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    return generatedSignature === razorpay_signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Get payment details by payment ID
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} - Payment details
 */
async function getPaymentDetails(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in paise (optional, defaults to full amount)
 * @returns {Promise<Object>} - Refund details
 */
async function refundPayment(paymentId, amount = null) {
  try {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100); // Convert to paise
    }
    
    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
}

module.exports = {
  createOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  refundPayment
};