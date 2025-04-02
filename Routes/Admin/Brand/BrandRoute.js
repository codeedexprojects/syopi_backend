const express = require('express');
const router = express.Router();
const brandController = require('../../../Controllers/Admin/Brand/BrandController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// Create a brand (Now supports both logo and image uploads)
router.post('/create', verifyToken(['admin']), multerConfig.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), brandController.createBrand);


// Get all brands (Populating offer discounts)
router.get('/view', verifyToken(['admin']), brandController.getBrands);

// Get brand by ID (Populating offer discounts)
router.get('/view/:id', verifyToken(['admin']), brandController.getBrandById);

// Update brand (Now supports updating both logo and image)
router.patch('/update/:id', 
    verifyToken(['admin']), 
    multerConfig.fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]), 
    brandController.updateBrand
);

// Delete brand
router.delete('/delete/:id', verifyToken(['admin']), brandController.deleteBrand);

// Search brand by name
router.get('/search', verifyToken(['admin']), brandController.searchBrand);

module.exports = router;
