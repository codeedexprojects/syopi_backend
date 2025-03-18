const express = require('express');
const router = express.Router();
const AdminOrderManagement = require('../../../Controllers/Admin/Order/AdminOrderManagement');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Route to get all orders with optional status filtering
router.get('/', verifyToken(['admin']), AdminOrderManagement.getAllOrders);

// Route to update order status
router.patch('/:orderId', verifyToken(['admin']), AdminOrderManagement.updateOrderStatus);

module.exports = router;