const express = require('express');
const router = express.Router();
const profileController = require('../../../Controllers/User/Profile/profileController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// Get user profile
router.get('/view', verifyToken(['customer']), profileController.getUserProfile);

// Update user 
router.patch('/update', verifyToken(['customer']), multerConfig.single('image'), profileController.updateUserData);

// Delete user account
router.delete('/delete', verifyToken(['customer']), profileController.deleteUserAccount);

module.exports = router;
