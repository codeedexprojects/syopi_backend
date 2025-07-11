const express = require('express');
const router = express.Router();
const profileController = require('../../../Controllers/User/Profile/profileController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

const uploadFields = multerConfig.fields([
    { name: "images", maxCount: 5 },
    { name: "storelogo", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "passbookImage", maxCount: 2}
])

// Get user profile
router.get('/view', verifyToken(['customer']), profileController.getUserProfile);

// Update user 
router.patch('/update', verifyToken(['customer']), multerConfig.single('image'), profileController.updateUserData);

// Delete user account
router.delete('/delete', verifyToken(['customer']), profileController.deleteUserAccount);

// Register vendor
router.post('/register', verifyToken(['customer']), uploadFields,profileController.registerVendor);


module.exports = router;
