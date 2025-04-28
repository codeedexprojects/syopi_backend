const express = require('express');
const router = express.Router();
const brandController = require('../../../Controllers/Vendor/Brand/BrandController');
const verifyToken = require('../../../Middlewares/jwtConfig');

// Get all brands
router.get('/view', verifyToken(['vendor']), brandController.getAllBrands);

// Get brand by id
router.get('/view/:id', verifyToken(['vendor']), brandController.getBrandById);

module.exports = router;
