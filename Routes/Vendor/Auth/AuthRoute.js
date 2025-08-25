const express = require('express');
const router = express.Router();
const vendorController = require('../../../Controllers/Vendor/Auth/Auth');


// login vendor
router.post('/login',vendorController.login);

router.post('/send-otp',vendorController.sendOtpVendor);

router.post('/verify-otp',vendorController.verifyOtpVendor);

router.post('/resend-otp',vendorController.resendOtpVendor);





module.exports = router;