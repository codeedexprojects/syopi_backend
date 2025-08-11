const express = require('express');
const router = express.Router();
const UserHomepageController = require('../../../Controllers/User/Homepage/UserHomePageController');
const attachWishlistIfAuthenticated = require('../../../Middlewares/WishlistIfAuthenticat');

router.get('/',attachWishlistIfAuthenticated,UserHomepageController.getHomePage)
router.get('/pay-smarter',UserHomepageController.getPaySmarter)
router.get('/shop-earn',UserHomepageController.getShopEarn)

module.exports=router   