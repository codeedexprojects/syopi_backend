const express = require('express');
const router = express.Router();
const vendorController = require('../../../Controllers/Vendor/Auth/Auth');

// login vendor
router.post('/login',vendorController.login);

module.exports = router;