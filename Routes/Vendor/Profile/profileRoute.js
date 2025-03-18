const express = require('express');
const router = express.Router();
const profileController = require('../../../Controllers/Vendor/Profile/profileController');
const verifyToken = require('../../../Middlewares/jwtConfig');

//get vendor profile
router.get('/view',verifyToken(['vendor']),profileController.getVendorProfile)

module.exports = router;