const express = require('express');
const router = express.Router();
const brandController = require('../../../Controllers/User/Brand/BrandController');

// Get all brands
router.get('/view', brandController.getBrands);

// Get brand by ID
router.get('/view/:id', brandController.getBrandById);

module.exports = router;
