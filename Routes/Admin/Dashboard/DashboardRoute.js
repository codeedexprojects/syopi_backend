const express = require('express');
const router = express.Router();
const Dashboard = require('../../../Controllers/Admin/Dashboard/Dashboard')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/products',verifyToken(['admin']),Dashboard.getProductStats)
router.get('/orders',verifyToken(['admin']),Dashboard.getOrderStats)
router.get('/users',verifyToken(['admin']),Dashboard.getUserStats)
// router.put('/update',verifyToken(['admin']),DeliveryCharge.updateDeliverySettings)



module.exports=router