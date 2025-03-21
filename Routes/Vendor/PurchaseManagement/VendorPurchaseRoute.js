const express = require('express');
const router = express.Router();
const purchaseController = require('../../../Controllers/Vendor/PurchaseManagement/VendorPurchaseController');
const verifyToken = require('../../../Middlewares/jwtConfig');



// Get purchase details for Vendor
router.get('/vendor/view', verifyToken(['vendor']), purchaseController.getVendorPurchaseData);

module.exports = router;
