const express = require('express');
const router = express.Router();
const affordableProductController = require('../../../Controllers/Admin/AffordableProducts/AffordableProductController');
const lowestPriceProductController = require('../../../Controllers/Admin/LowestPriceProducts/LowestProductsController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// Affordable Products Routes
router.post('/affordable/create', verifyToken(['admin']), multerConfig.single('image'), affordableProductController.createAffordableProduct);
router.get('/view', verifyToken(['admin']), affordableProductController.getAllAffordableProducts);
router.patch('/affordable/update/:id', verifyToken(['admin']), multerConfig.single('image'), affordableProductController.updateAffordableProduct);
router.delete('/affordable/delete/:id', verifyToken(['admin']), affordableProductController.deleteAffordableProduct);

// Lowest Price Products Routes
router.post('/lowest-price/create', verifyToken(['admin']), multerConfig.single('image'), lowestPriceProductController.createLowestPriceProduct);
router.get('/view', verifyToken(['admin']), lowestPriceProductController.getAllLowestPriceProducts);
router.patch('/lowest-price/update/:id', verifyToken(['admin']), multerConfig.single('image'), lowestPriceProductController.updateLowestPriceProduct);
router.delete('/lowest-price/delete/:id', verifyToken(['admin']), lowestPriceProductController.deleteLowestPriceProduct);

module.exports = router;
