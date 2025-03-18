const express = require('express');
const router = express.Router();
const profileController = require('../../../Controllers/Admin/Profile/profileController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// get admin profile
router.get('/view',verifyToken(['admin']),profileController.getAdminProfile);

// update admin
router.patch('/update',verifyToken(['admin']),profileController.updateAdminData);


module.exports = router;