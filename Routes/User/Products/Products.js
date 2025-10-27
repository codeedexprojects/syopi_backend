const express = require('express');
const router = express.Router();
const productController = require('../../../Controllers/User/Products/ProductController')
const attachWishlistIfAuthenticated = require('../../../Middlewares/WishlistIfAuthenticat');
const verifyToken = require('../../../Middlewares/jwtConfig')
const multerConfig=require('../../../Middlewares/MulterConfig')



// get category
router.get('/view',attachWishlistIfAuthenticated,productController.getallProducts)

// view by id
router.get('/view/:id',attachWishlistIfAuthenticated,productController.getProductById)

// search products 
// router.get('/search',attachWishlistIfAuthenticated,productController.searchProducts);


// Get similar products
router.get('/similar/:id', attachWishlistIfAuthenticated, productController.getSimilarProducts);

router.get('/expected_date',productController.getExpectedDeliveryDate)


router.get('/keywords',attachWishlistIfAuthenticated,productController.searchKeywords);

router.get('/products',attachWishlistIfAuthenticated,productController.getProductsByKeyword);

router.get('/recommended-products',attachWishlistIfAuthenticated,productController.getRecommendedProducts);


module.exports=router


