const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../../../Controllers/User/Auth/Auth');
const { registerUserValidator, loginUserValidator } = require('../../../validators/userValidator');
const validationHandler = require('../../../Middlewares/validationHandler');
const { otpLimiter } = require('../../../Middlewares/rateLimiter')

// Register User
router.post('/register', registerUserValidator, validationHandler, userController.registerUser);

//Resent OTP
router.post('/register/resend-otp',userController.resendOTP);

// otp verficiation for saving to db
router.post('/register/verify-otp',userController.verifyOTP);

// Login User
router.post('/login', loginUserValidator, validationHandler, userController.loginUser);

//Resend OTP
router.post('/login/resend-otp',userController.resendLoginOTP);

// Otp verficiation 
router.post('/login/verify-otp',userController.verifyLoginOtp);

// google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// google callback
router.get('/google/callback', userController.googleLoginCallback);

// Google login for Android (ID token)
router.post('/google/android', userController.androidLoginCallback);


// Apple Login
router.get("/apple", passport.authenticate("apple", { scope: ["name", "email"] }));

// Apple Callback
router.post("/apple/callback", userController.appleLoginCallback);

router.post('/send-otp', otpLimiter, loginUserValidator, validationHandler, userController.sendOtp);

router.post('/resend-otp', otpLimiter, userController.resendOtp);


router.post('/verify-otp', otpLimiter, userController.verifyOtp);


module.exports = router;
