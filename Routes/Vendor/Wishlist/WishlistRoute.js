const express = require('express');
const router = express.Router();
const wishlistController = require('../../../Controllers/Vendor/Wishlist/WishlistController');
const verifyToken = require('../../../Middlewares/jwtConfig');

//Get All Wishlist Counts for login vendor
router.get('/getcount',verifyToken(['vendor']),wishlistController.getAllWishlistCounts);

module.exports = router;