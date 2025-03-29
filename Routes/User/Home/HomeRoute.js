const express = require('express');
const router = express.Router();
const UserHomepageController = require('../../../Controllers/User/Homepage/UserHomePageController');
const attachWishlistIfAuthenticated = require('../../../Middlewares/WishlistIfAuthenticat');

router.get('/',attachWishlistIfAuthenticated,UserHomepageController.getHomePage)
module.exports=router   