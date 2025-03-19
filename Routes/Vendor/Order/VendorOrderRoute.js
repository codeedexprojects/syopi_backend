const express = require('express')
const router = express.Router()
const vendorOrderController = require('../../../Controllers/Vendor/Order/vendorOrderManagement')
const verifyToken = require('../../../Middlewares/jwtConfig');

// Route to get all orders with optional status filtering

router.get('/',verifyToken(['vendor']),vendorOrderController.getOrderByVendorId)


// Route to update order status
router.patch('/', verifyToken(['vendor']), vendorOrderController.updateOrderStatus);

module.exports = router;