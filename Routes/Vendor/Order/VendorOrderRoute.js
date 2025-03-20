const express = require('express');
const router = express.Router();
const vendorOrderManagement = require('../../../Controllers/Vendor/Order/VendorOrderManagement');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Route to get all orders with optional status filtering
router.get('/', verifyToken(['vendor']), vendorOrderManagement.getOrderByVendorId);

// Route to update order status
router.patch('/', verifyToken(['vendor']), vendorOrderManagement.updateOrderStatus);

module.exports = router;
