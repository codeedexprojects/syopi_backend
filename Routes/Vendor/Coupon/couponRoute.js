const express = require('express');
const router = express.Router();
const couponController = require('../../../Controllers/Vendor/Coupon/CouponController');
const verifyToken = require('../../../Middlewares/jwtConfig');

//create coupon
router.post('/create',verifyToken(['vendor']),couponController.createCoupon);

// get all coupons
router.get('/get',verifyToken(['vendor']),couponController.getCoupons);

// get coupon by id
router.get('/get/:id',verifyToken(['vendor']),couponController.getCouponById);

// Update a coupon
router.patch('/update/:id',verifyToken(['vendor']),couponController.updateCoupon);

// Delete a coupon
router.delete('/delete/:id',verifyToken(['vendor']),couponController.deleteCoupon);

// toggle isActive
router.patch('/toggle/:id',verifyToken(['vendor']),couponController.toggleCouponStatus);

// validate
router.post('/validate',verifyToken(['vendor']),couponController.validateCoupon);

module.exports = router;