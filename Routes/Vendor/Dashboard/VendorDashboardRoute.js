const express = require('express');
const router = express.Router();
const VendorDashboard = require('../../../Controllers/Vendor/Dashboard/DashboardController')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/',verifyToken(['admin']),VendorDashboard.getDashboard)
// router.put('/update',verifyToken(['admin']),DeliveryCharge.updateDeliverySettings)



module.exports=router