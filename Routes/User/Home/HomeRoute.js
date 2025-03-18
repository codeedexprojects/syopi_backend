const express = require('express');
const router = express.Router();
const productController = require('../../../Controllers/User/Products/ProductController')

router.get('/',productController.getHomePage)
module.exports=router   