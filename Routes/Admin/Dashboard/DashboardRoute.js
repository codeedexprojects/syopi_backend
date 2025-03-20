const express = require('express');
const router = express.Router();
const Dashboard = require('../../../Controllers/Admin/Dashboard/Dashboard')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/',verifyToken(['admin']),Dashboard.getAdminDashboard)
// router.put('/update',verifyToken(['admin']),DeliveryCharge.updateDeliverySettings)



module.exports=router