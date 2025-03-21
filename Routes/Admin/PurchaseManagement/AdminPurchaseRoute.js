const express = require('express');
const router = express.Router();
const purchaseController = require('../../../Controllers/Admin/PurchaseManagement/AdminPurchaseController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Get purchase details for Admin
router.get('/view', verifyToken(['admin']), purchaseController.getAdminPurchaseData);

module.exports = router;
