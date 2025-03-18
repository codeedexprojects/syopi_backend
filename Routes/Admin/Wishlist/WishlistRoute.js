const express = require('express');
const router = express.Router();
const wishlistController = require('../../../Controllers/Admin/Wishlist/WishlistController');
const verifyToken = require('../../../Middlewares/jwtConfig');

//Get All Wishlist Counts for Admin
router.get('/getcount',verifyToken(['admin']),wishlistController.getAllWishlistCounts);

//Get Wishlist Count for a Product
router.get('/getcount/:id',verifyToken(['admin']),verifyToken(['admin']),wishlistController.getProductWishlistCount);

module.exports = router;