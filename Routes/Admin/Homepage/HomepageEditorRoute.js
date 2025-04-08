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

// Top Picks Routes
router.post('/top-pick/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createTopPickProduct);
router.patch('/top-pick/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateTopPickProduct);
router.delete('/top-pick/delete/:id', verifyToken(['admin']), HomepageController.deleteTopPickProduct);
router.get('/top-pick/view', verifyToken(['admin']), HomepageController.getAllTopPickProducts);

// Top Sale Section Routes
router.post('/top-sale/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createTopSaleSection);
router.patch('/top-sale/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateTopSaleSectionProduct);
router.delete('/top-sale/delete/:id', verifyToken(['admin']), HomepageController.deleteTopSaleSectionProduct);
router.get('/top-sale/view', verifyToken(['admin']), HomepageController.getAllTopSaleSectionProducts);

// Referral Section Routes
router.post('/referral/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createReferralSection);
router.patch('/referral/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateReferralSectionImages);
router.delete('/referral/delete/:id', verifyToken(['admin']), HomepageController.deleteReferralSectionImages);
router.get('/referral/view', verifyToken(['admin']), HomepageController.getAllReferralSection);

module.exports = router;
