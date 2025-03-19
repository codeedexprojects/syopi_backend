const express = require('express');
const router = express.Router();
const AdminOrderController = require('../../../Controllers/Admin/Order/AdminOrderController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Route to get all orders with optional status filtering
router.get('/', verifyToken(['admin']), AdminOrderController.getAllOrders);

// Route to update order status
router.patch('/', verifyToken(['admin']), AdminOrderController.updateOrderStatus);

module.exports = router;