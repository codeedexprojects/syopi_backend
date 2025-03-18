const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../../../Controllers/User/Auth/Auth');
const { registerUserValidator, loginUserValidator } = require('../../../validators/userValidator');
const validationHandler = require('../../../Middlewares/validationHandler');

// Register User
router.post('/register', registerUserValidator, validationHandler, userController.registerUser);

// otp verficiation for saving to db
router.post('/register/verify-otp',userController.verifyOTP);

// Login User
router.post('/login', loginUserValidator, validationHandler, userController.loginUser);

// otp for password reset (phone)
router.post('/forgot-password/send-otp', userController.sendForgotPasswordOTPNumber);

// otp verfication for password reset (phone)
router.post('/forgot-password/verify-otp', userController.verifyForgotPasswordOTPNumber);

// reset password after verification
router.patch('/forgot-password/reset-password', userController.resetPassword);

// google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// google callback
router.get('/google/callback', userController.googleLoginCallback);

// Apple Login
router.get("/apple", passport.authenticate("apple", { scope: ["name", "email"] }));

// Apple Callback
router.post("/apple/callback", userController.appleLoginCallback);

module.exports = router;
