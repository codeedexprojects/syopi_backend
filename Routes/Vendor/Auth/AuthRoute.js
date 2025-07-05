const express = require('express');
const router = express.Router();
const vendorController = require('../../../Controllers/Vendor/Auth/Auth');
const multerConfig = require('../../../Middlewares/MulterConfig');

const uploadFields = multerConfig.fields([
    { name: "images", maxCount: 5 },
    { name: "storelogo", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "passbookImage", maxCount: 2}
])

// login vendor
router.post('/login',vendorController.login);


router.post('/register',uploadFields,vendorController.registerVendor);


module.exports = router;