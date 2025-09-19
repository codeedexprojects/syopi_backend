const express = require('express');
const router = express.Router();
const ReviewController = require('../../../Controllers/User/Reviews/ReviewController')
// const multerMiddleware =require('../../../Middlewares/')
const verifyToken=require('../../../Middlewares/jwtConfig')



router.post("/add",  verifyToken(['customer']), ReviewController.addReview); 
router.get("/has-reviewed", verifyToken(['customer']), ReviewController.hasReviewedLatestDelivered); 
router.get("/:productId", ReviewController.getReviewsByProduct); 


module.exports = router;