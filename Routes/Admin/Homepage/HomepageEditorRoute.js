const express = require('express');
const router = express.Router();
const HomepageController = require('../../../Controllers/Admin/HomePage/HomepageController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// Affordable Products Routes
router.post('/affordable/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createAffordableProduct);
router.get('/view', verifyToken(['admin']), HomepageController.getAllProducts);
router.patch('/affordable/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateAffordableProduct);
router.delete('/affordable/delete/:id', verifyToken(['admin']), HomepageController.deleteAffordableProduct);

// Lowest Price Products Routes
router.post('/lowest-price/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createLowestPriceProduct);
router.patch('/lowest-price/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateLowestPriceProduct);
router.delete('/lowest-price/delete/:id', verifyToken(['admin']), HomepageController.deleteLowestPriceProduct);

module.exports = router;
