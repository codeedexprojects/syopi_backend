const express = require('express');
const router = express.Router();
const wishlistController = require('../../../Controllers/User/Wishlist/WishlistController');
const verifyToken = require('../../../Middlewares/jwtConfig');

//add to wishlist
router.post('/add',verifyToken(['customer']),wishlistController.addToWishList);

// get all user wishlist
router.get('/get',verifyToken(['customer']),wishlistController.getUserWishlist);

//remove product from wishlist
router.delete('/delete',verifyToken(['customer']),wishlistController.removeFromWishlist);

module.exports = router;