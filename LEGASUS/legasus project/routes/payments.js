const express = require('express');
const router = express.Router();
const razorpayService = require('../services/razorpayService');
const excelService = require('../services/excelService');

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a new Razorpay order
 * @access  Private
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }
    
    const order = await razorpayService.createOrder(amount, currency, receipt);
    
    // Return order details to client
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature
 * @access  Private
 */
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_details } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'All payment details are required' });
    }
    
    // Verify payment signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }
    
    // If order details are provided, save the order to Excel
    if (order_details && order_details.userId) {
      const { userId, products, total, shippingAddress } = order_details;
      
      // Create order in Excel
      const order = await excelService.createOrder({
        userId,
        products: JSON.stringify(products),
        total,
        status: 'Paid',
        paymentId: razorpay_payment_id,
        shippingAddress: JSON.stringify(shippingAddress),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment details
 * @access  Private
 */
router.get('/:paymentId', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    const payment = await razorpayService.getPaymentDetails(paymentId);
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/payments/:paymentId/refund
 * @desc    Refund a payment
 * @access  Private (Admin)
 */
router.post('/:paymentId/refund', async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    const { amount } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }
    
    const refund = await razorpayService.refundPayment(paymentId, amount);
    
    // Update order status in Excel if needed
    // This would require finding the order by payment ID and updating its status
    
    res.json(refund);
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;