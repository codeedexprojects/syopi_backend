const express = require('express');
const router = express.Router();
const wishlistController = require('../../../Controllers/Admin/Wishlist/WishlistController');
const verifyToken = require('../../../Middlewares/jwtConfig');

//Get All Wishlist Counts for Admin
router.get('/getcount',verifyToken(['admin']),wishlistController.getAllWishlistCounts);

//Get Wishlist Count for a Product
router.get('/getcount/:id',verifyToken(['admin']),verifyToken(['admin']),wishlistController.getProductWishlistCount);

router.get("/count", wishlistController.getWishlistProductCount);
router.get("/products", wishlistController.getWishlistProducts);
router.get("/product/:id/users", wishlistController.getUsersForWishlistProduct);


module.exports = router;