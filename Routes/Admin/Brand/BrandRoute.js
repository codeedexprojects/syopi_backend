const express = require('express');
const router = express.Router();
const brandController = require('../../../Controllers/Admin/Brand/BrandController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// Create a brand
router.post('/create', verifyToken(['admin']), multerConfig.single('logo'), brandController.createBrand);

// Get all brands
router.get('/view', verifyToken(['admin']), brandController.getBrands);

// Get brand by ID
router.get('/view/:id', verifyToken(['admin']), brandController.getBrandById);

// Update brand
router.patch('/update/:id', verifyToken(['admin']), multerConfig.single('logo'), brandController.updateBrand);

// Delete brand
router.delete('/delete/:id', verifyToken(['admin']), brandController.deleteBrand);

// Search brand by name
router.get('/search', verifyToken(['admin']), brandController.searchBrand);

module.exports = router;
