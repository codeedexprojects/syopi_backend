const express = require('express');
const router = express.Router();
const orderController = require('../../../Controllers/User/Order/OrderController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Create order
router.post('/create', verifyToken(['customer']), orderController.placeOrder);

// Get user orders
router.get('/view', verifyToken(['customer']), orderController.getUserOrder);

// Get order by ID
router.get('/view/:orderId', verifyToken(['customer']), orderController.getSingleOrder);

// Request order return
router.post('/return/:orderId', verifyToken(['customer']), orderController.requestOrderReturn);

// Cancel order
router.post('/cancel/:orderId', verifyToken(['customer']), orderController.cancelOrder);

// Invoice
router.get('/invoice/:orderId', verifyToken(['customer']), orderController.downloadInvoice);


module.exports = router;
