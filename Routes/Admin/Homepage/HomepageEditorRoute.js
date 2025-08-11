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
router.get('/lowest-price/view', verifyToken(['admin']), HomepageController.getLowestPriceProducts);


// Top Picks Routes
router.post('/top-pick/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createTopPickProduct);
router.patch('/top-pick/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateTopPickProduct);
router.get('/top-pick/view', verifyToken(['admin']), HomepageController.getAllTopPickProducts);

// Top Sale Section Routes
router.post('/top-sale/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createTopSaleSection);
router.patch('/top-sale/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateTopSaleSectionProduct);
router.get('/top-sale/view', verifyToken(['admin']), HomepageController.getAllTopSaleSectionProducts);

// Referral Section Routes
router.post('/offer/create', verifyToken(['admin']), multerConfig.single('image'), HomepageController.createOfferSection);
router.patch('/offer/update/:id', verifyToken(['admin']), multerConfig.single('image'), HomepageController.updateOfferSectionImages);
router.delete('/offer/delete/:id', verifyToken(['admin']), HomepageController.deleteOfferSectionImages);
router.get('/offer/view', verifyToken(['admin']), HomepageController.getAllOfferSection);

//Shop Earn
router.post("/shop-earn/", multerConfig.single("image"), HomepageController.createShopAndEarn);
router.get("/shop-earn/", HomepageController.getShopAndEarn);
router.patch("/shop-earn/:id", multerConfig.single("image"), HomepageController.updateShopAndEarn);
router.delete("/shop-earn/:id", HomepageController.deleteShopAndEarn);

//Pay Smarter
router.post("/pay-smarter/", multerConfig.single("image"), HomepageController.createPaySmarter);
router.patch("/pay-smarter/:id", multerConfig.single("image"),HomepageController.updatePaySmarter);
router.get("/pay-smarter/", HomepageController.getPaySmarter);
router.delete("/pay-smarter/:id", HomepageController.deletePaySmarter);

module.exports = router;
