const express = require('express');
const router = express.Router();
const ReviewController = require('../../../Controllers/User/Reviews/ReviewController')
// const multerMiddleware =require('../../../Middlewares/')
const verifyToken=require('../../../Middlewares/jwtConfig')



router.post("/add",  verifyToken(['customer']), ReviewController.addReview); 
router.get("/:productId", ReviewController.getReviewsByProduct); // Get reviews by product

module.exports = router;