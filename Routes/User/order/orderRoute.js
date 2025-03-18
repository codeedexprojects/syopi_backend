const express = require('express');
const router = express.Router();
const orderController = require('../../../Controllers/User/Order/OrderController')
const verifyToken = require('../../../Middlewares/jwtConfig')
const multerConfig=require('../../../Middlewares/MulterConfig')



// create order
router.post('/create',verifyToken(['customer']),orderController.placeOrder)

// get userorders
router.get('/view',verifyToken(['customer']),orderController.getUserOrder)

// by orderId
router.get('/view/:orderId', verifyToken(['customer']),orderController.getSingleOrder);


module.exports=router