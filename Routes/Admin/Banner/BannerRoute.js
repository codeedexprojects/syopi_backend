const express = require('express');
const router = express.Router();
const bannerController = require('../../../Controllers/Admin/Banner/bannerController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// Create new banner
router.post('/create', verifyToken(['admin']), multerConfig.single('image'), bannerController.createBanner);

// Get all banners
router.get('/get', verifyToken(['admin']), bannerController.getAllBanners);

// Get a banner by ID
router.get('/get/:id', verifyToken(['admin']), bannerController.getBannerById);

// Update banner
router.patch('/update/:id', verifyToken(['admin']), multerConfig.single('image'), bannerController.updateBanner);

// Delete banner
router.delete('/delete/:id', verifyToken(['admin']), bannerController.deleteBanner);


module.exports = router;
