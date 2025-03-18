const express = require('express');
const router = express.Router();
const ReviewController = require('../../../Controllers/User/Review/reviewController')
const multerMiddleware =require('../../../Middlewares/multerMiddleware')
const verifyToken=require('../../../Middlewares/jwtMiddleware')



router.post("/add",  verifyToken(['customer']),multerMiddleware.single('image'), ReviewController.addReview); 
router.get("/:productId", ReviewController.getReviewsByProduct); // Get reviews by product

module.exports = router;