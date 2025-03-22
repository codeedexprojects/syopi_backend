const express = require('express');
const router = express.Router();
const UserHomepageController = require('../../../Controllers/User/Homepage/UserHomePageController')

router.get('/',UserHomepageController.getHomePage)
module.exports=router   