const User = require('../../../Models/User/UserModel');
const Coin = require('../../../Models/Admin/CoinModel')
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../../../utils/tokenUtils');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const NodeCache = require('node-cache');
const otpGenerator = require('otp-generator');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const admin = require('../../../Configs/firebaseConfig');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cache = new NodeCache({ stdTTL: 300 });
const api_key = process.env.FACTOR_API_KEY

// Register User
exports.registerUser = async (req, res) => {
    const { name, email, phone, password, referredBy } = req.body;
  
    try {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ msg: 'Phone number already exists' });
      }
      const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });

      cache.set(phone, { name,phone,email,referredBy,password,otp });

      const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/${otp}`)
      // console.log('2Factor Response:', response.data);
      if(response.data.Status !== 'Success'){
        return res.status(500).json({ message: 'Failed to send OTP. Try again later.' });
      }

      return res.status(200).json({ message: 'OTP sent successfully' });
  
    } catch (error) {
      console.error('2Factor Error:', error?.response?.data || error.message);
      res.status(500).json({ message: 'Server error', error: error.response.data });
      // console.log(error)
    }
  };


  //resent otp
  exports.resendOTP = async (req, res) => {
    const { phone } = req.body;
  
    try {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
  
      const cachedData = cache.get(phone);
      if (!cachedData) {
        return res.status(400).json({ message: 'No registration attempt found for this phone number' });
      }
  
      // Generate new OTP and update cache
      const otp = otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
  
      // Update cache with new OTP
      cache.set(phone, { ...cachedData, otp });
  
      // Send OTP via 2Factor
      const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/${otp}`);
  
      if (response.data.Status !== 'Success') {
        return res.status(500).json({ message: 'Failed to resend OTP. Try again later.' });
      }
  
      return res.status(200).json({ message: 'OTP resent successfully' });
  
    } catch (error) {
      console.error('Resend OTP Error:', error?.response?.data || error.message);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  
// verify otp and register user
exports.verifyOTP = async(req,res) => {
  const { phone,otp } = req.body;
  try {
    //retrieve stored data from cashe
    const cachedData = cache.get(phone);
    if(!cachedData){
      return res.status(400).json({ message: 'OTP  invalid or expired ' });
    }

    //verify the otp with 2Factor API
    const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`);
    if(response.data.Status !== 'Success'){
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' })
    }

    const settings = await Coin.findOne();
    const referralCoinReward = settings?.referralCoins || 40; // Default to 40 if not found

    // validate refferedBy (optional)
    let referredUser = null;
    if(cachedData.referredBy){
      referredUser = await User.findOneAndUpdate(
        { referralCode: cachedData.referredBy },
        { $inc: { coins: referralCoinReward } },
        { new: true }
      );

      if(!referredUser){
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    // Create new user
    const newUser = new User({
      name: cachedData.name,
      email: cachedData.email,
      phone: cachedData.phone,
      password: cachedData.password,
      referredBy: cachedData.referredBy,
    });
    await newUser.save();

    //generate JWT token
    const token = jwt.sign(
      // { userId: newUser._id, role: newUser.role },
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    //delete temporary data from cache
    cache.del(phone);

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
  });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Login User
exports.loginUser = async (req, res) => {
    const { emailOrPhone, password } = req.body;
  console.log(emailOrPhone,password)
    try {
      const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(isPasswordValid)
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const payload = { id: user._id, role: user.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);
  
      res.status(200).json({
        message: 'User logged in successfully',
        user: { name: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role ,userId:user._id},
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

// otp for forget passsword (phone)
exports.sendForgotPasswordOTPNumber = async (req, res) => {
  const { phone } = req.body;

  try {   
      const user = await User.findOne({ phone });
      if (!user) {
          return res.status(404).json({ message: 'User with this phone number does not exist' });
      }
      const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false,  lowerCaseAlphabets: false,specialChars: false });
      
      // const response = await axios.get(
      //     `https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN/OTP1`
      // );
      const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/${otp}`)

      if (response.data.Status !== 'Success') {
          return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
      }

      return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// verify otp for password reset (phone)
exports.verifyForgotPasswordOTPNumber = async (req, res) => {
  const { phone, otp } = req.body;

  try {
      const response = await axios.get(
          `https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`
      );

      if (response.data.Status !== 'Success') {
          return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      }
      const tempToken = jwt.sign(
          { phone },
          process.env.JWT_SECRET,
          { expiresIn: '5m' } 
      );
      
      return res.status(200).json({ 
          message: 'OTP verified successfully. Use the token to reset password.', 
          tempToken 
      });       
       
  } catch (err) {
      return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// reset password after verification
exports.resetPassword = async (req, res) => {
  const { tempToken, newPassword } = req.body;

  try {
      
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      const phone = decoded.phone;

      
      const user = await User.find({ phone });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.updateOne({ phone }, { password:hashedPassword });

      return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
      console.error(err.message);
      if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token has expired. Please try again.' });
      } else if (err.name === 'JsonWebTokenError') {
          return res.status(400).json({ message: 'Invalid token.' });
      }

      return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Google Login Callback

// exports.googleLoginCallback = async(req, res, next) => {
//   console.log(req.user)
//     try {
//       // Extract email correctly
//       const email = req.user?.emails?.[0]?.value;
//       const googleId = req.user?.id;

//       if (!email) {
//         return res.status(400).json({ message: 'Google login failed: email not found.' });
//       }

//       // Check if a user with this email or googleId exists
//       let existingUser = await User.findOne({ $or: [{ googleId}, { email }] });

//       if (existingUser) {
//         // // If user exists, link the Google ID to the existing user (if it's not already set)
//         // if (!existingUser.googleId) {
//         //   existingUser.googleId = user.id;  // Link the Google ID to the user
//         //   await existingUser.save();
//         // }
//          // Generate JWT token
//       const token = jwt.sign({ id: existingUser._id, role: existingUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

//       res.status(200).json({
//         message: 'Google login successful',
//         token,
//         user: {
//           name: existingUser.name,
//           email: existingUser.email,
//           role: existingUser.role,
//           userId: existingUser._id,
//         },
//       });
//       } 
//       // If the user does not exist, create a new user
//     const newUser = new User({
//       name: req.user?.displayName || req.user?.name,
//       email: req.user?.emails?.[0]?.value,
//       googleId: req.user?.id,
//     });

//     // Save the new user to the database
//     await newUser.save();

//     // Generate a JWT token after creating the user
//     const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

//     // Respond with the user details and token
//     res.status(200).json({
//       message: 'Google login successful',
//       token,
//       user: {
//         name: newUser.name,
//         email: newUser.email,
//         role: newUser.role,
//         userId: newUser._id,
//       },
//     });
//     } catch (error) {
//       console.error('Error during Google login callback:', error);
//       res.status(500).json({ message: 'Server error', error: error.message });
//     }
//   (req, res, next);
// };



exports.googleLoginCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
      if (err) {
          return res.status(500).json({ message: 'Authentication failed', error: err.message });
      }
      try {
          // Check if a user with this email exists
          const existingUser = await User.findOne({ email: user.email });
          if (existingUser) {
              user = existingUser; // Link to existing user
          } else {
              // Create a new user if not found
              user = await User.create({
                  name: user.name,
                  email: user.email,
                  googleId: user.id,
              });
          }
          // Generate JWT token
          const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
          res.status(200).json({
              message: 'Google login successful',
              token,
              user: {
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  userId:user._id
              },
          });
      } catch (error) {
        console.log(err)
          res.status(500).json({ message: 'Server error', error: error.message });
      }
  })(req, res, next);
};



exports.androidLoginCallback = async (req, res) => {
  const { idToken } = req.body;

  try {
      // Verify the ID token
      // const ticket = await client.verifyIdToken({
      //     idToken,
      //     audience: process.env.GOOGLE_CLIENT_ID,
      // });

      // const payload = ticket.getPayload();
      // const { sub, email, name } = payload;
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name } = decodedToken;
      // Check if a user with this email exists
      let user = await User.findOne({ email });
      if (!user) {
          user = await User.create({
              name:name || "user",
              email,
              googleId: uid,
          });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.status(200).json({
          message: 'Google login successful',
          token,
          user: {
              name: user.name,
              email: user.email,
              role: user.role,
              userId: user._id,
          },
      });
  } catch (error) {
      console.log(error);
      res.status(401).json({ message: 'Invalid Google ID token', error: error.message });
  }
};

//apple login callback
exports.appleLoginCallback = (req, res, next) => {
  passport.authenticate("apple", { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Authentication failed", error: err.message });
    }
    try {
      // Check if the user exists
      let existingUser = await User.findOne({ appleId: user.appleId });

      if (!existingUser) {
        existingUser = await User.create({
          name: user.name,
          email: user.email,
          appleId: user.appleId,
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: existingUser._id, role: existingUser.role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(200).json({
        message: "Apple login successful",
        token,
        user: {
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          userId: existingUser._id,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  })(req, res, next);
};