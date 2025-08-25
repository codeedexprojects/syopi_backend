const express = require('express');
const router = express.Router();
const profileController = require('../../../Controllers/Vendor/Profile/profileController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

const uploadFields = multerConfig.fields([
    { name: "images", maxCount: 5 },
    { name: "storelogo", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "passbookImage", maxCount: 2}
])

//get vendor profile
router.get('/view',verifyToken(['vendor']),profileController.getVendorProfile)

router.patch('/update',verifyToken(['vendor']),uploadFields,profileController.updateVendorProfile);


module.exports = router;