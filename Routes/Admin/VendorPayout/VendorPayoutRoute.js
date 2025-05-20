const express = require('express');
const router = express.Router();
const VendorPayoutController = require('../../../Controllers/VendorPayout/VendorPayout')
const verifyToken = require('../../../Middlewares/jwtConfig')


router.get('/view',verifyToken(['admin']),VendorPayoutController.getAllVendorPayouts)
router.get('/view/:vendorId', verifyToken(['admin']), VendorPayoutController.getVendorPayoutsByVendorId);
router.put('/update',verifyToken(['admin']),VendorPayoutController.updateVendorPayoutStatus)



module.exports=router