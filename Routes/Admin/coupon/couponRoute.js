const express = require('express');
const router = express.Router();
const verifyToken = require('../../../Middlewares/jwtConfig')
const couponController = require('../../../Controllers/Admin/Coupon/couponController');

// Create a coupon
router.post('/create',verifyToken(["admin"]), couponController.createCoupon);

// Get all coupons
router.get('/get', couponController.getCoupons);

// Get a coupon by ID
router.get('/:id', couponController.getCouponById);

// Update a coupon
router.patch('/update/:id',verifyToken(["admin"]), couponController.updateCoupon);

// Delete a coupon
router.delete('/delete/:id', couponController.deleteCoupon);

// toggle isActive
router.patch('/toggle/:id',verifyToken(["admin"]), couponController.toggleCouponStatus)

// validate
router.post('/validate', couponController.validateCoupon);

module.exports = router;
