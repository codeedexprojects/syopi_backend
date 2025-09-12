const express = require('express');
const router = express.Router();
const AdminOrderController = require('../../../Controllers/Admin/Order/AdminOrderController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Route to get all orders with optional status filtering
router.get('/', verifyToken(['admin']), AdminOrderController.getAllOrders);

// Route to update order status
router.patch('/', verifyToken(['admin']), AdminOrderController.updateOrderStatus);

router.get('/:userId', verifyToken(['admin']), AdminOrderController.getOrderByUserId);

router.patch('/approve', verifyToken(['admin']), AdminOrderController.adminApproveReturn);



module.exports = router;