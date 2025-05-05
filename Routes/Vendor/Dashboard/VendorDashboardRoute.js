const express = require('express');
const router = express.Router();
const VendorDashboard = require('../../../Controllers/Vendor/Dashboard/DashboardController')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/products',verifyToken(['vendor']),VendorDashboard.getVendorProductStats)
router.get('/orders',verifyToken(['vendor']),VendorDashboard.getVendorOrderStats)
// router.put('/update',verifyToken(['admin']),DeliveryCharge.updateDeliverySettings)



module.exports=router