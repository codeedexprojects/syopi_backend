const express = require('express');
const router = express.Router();
const CheckoutController = require('../../../Controllers/User/Checkout/CheckoutController')
const verifyToken = require('../../../Middlewares/jwtConfig')
const multerConfig=require('../../../Middlewares/MulterConfig')



// get category
router.post('/create',verifyToken(['customer']),CheckoutController.createCheckout)
// get checkout by id
router.get('/view/:checkoutId',verifyToken(['customer']),CheckoutController.getCheckout)
// delete checkout
router.delete('/delete/:checkoutId',verifyToken(['customer']),CheckoutController.deleteCheckout)

// apply coupon
router.post('/apply/coupon',verifyToken(['customer']),CheckoutController.applyCoupon)

//get available coupons
router.get('/get/:checkoutId/coupons',verifyToken(['customer']),CheckoutController.getAvailableCoupons);

router.post('/buy-now',verifyToken(['customer']),CheckoutController.createBuyNowCheckout);

// apply syopi coins
router.post('/apply/coin',verifyToken(['customer']),CheckoutController.applyCoins)

// Remove Coupon
router.post('/remove-coupon',verifyToken(['customer']),CheckoutController.removeCoupon)


module.exports=router