const express = require('express');
const router = express.Router();
const affordableProductController = require('../../../Controllers/Admin/AffordableProducts/AffordableProductController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

// Create new affordable product
router.post('/create', verifyToken(['admin']), multerConfig.single('image'), affordableProductController.createAffordableProduct);

// Get all affordable products
router.get('/view', verifyToken(['admin']), affordableProductController.getAllAffordableProducts);


// Update affordable product
router.patch('/update/:id', verifyToken(['admin']), multerConfig.single('image'), affordableProductController.updateAffordableProduct);

// Delete affordable product
router.delete('/delete/:id', verifyToken(['admin']), affordableProductController.deleteAffordableProduct);

module.exports = router;
