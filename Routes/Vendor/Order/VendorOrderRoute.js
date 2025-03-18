const express = require('express')
const router = express.Router()
const vendorOrderManagement = require('../../../Controllers/Vendor/Order/vendorOrderManagement')
const verifyToken = require('../../../Middlewares/jwtConfig');


router.get('/',verifyToken(['vendor']),vendorOrderManagement.getOrderByVendorId)

module.exports = router;