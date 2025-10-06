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
const DeletedUser = require('../../../Models/User/deletedUserModel'); // 👈 new model


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cache = new NodeCache({ stdTTL: 300 });
const api_key = process.env.FACTOR_API_KEY

// Register User
exports.registerUser = async (req, res) => {
    const { name, email, phone, referredBy } = req.body;
  
    try {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ msg: 'Phone number already exists' });
      }

      cache.set(phone, { name,phone,email,referredBy });

      const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN`)
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
  
  
      // Update cache with new OTP
      cache.set(phone, { ...cachedData });
  
      // Send OTP via 2Factor
      const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN`);
  
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
exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    // Step 1: Get cached registration data
    const cachedData = cache.get(phone);
    if (!cachedData) {
      return res.status(400).json({ message: 'OTP invalid or expired' });
    }

    // Step 2: Verify OTP using 2Factor
    const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`);
    if (response.data.Status !== 'Success') {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Step 3: Get referral settings
    const settings = await Coin.findOne();
    const referralCoinReward = settings?.referralCoins || 40;

    // Step 4: Handle referral (if provided)
    let referredUser = null;
    if (cachedData.referredBy) {
      // Check if the referral code belongs to a deleted user
      const isDeletedUser = await DeletedUser.findOne({ phone: cachedData.phone });

      if (!isDeletedUser) {
        // Try rewarding active referrer
        referredUser = await User.findOneAndUpdate(
          { referralCode: cachedData.referredBy },
          { $inc: { coins: referralCoinReward } },
          { new: true }
        );

        if (!referredUser) {
          return res.status(400).json({ message: 'Invalid referral code' });
        }
      }
      // If referral is deleted, silently skip reward
    }

    // Step 5: Create new user
    const newUser = new User({
      name: cachedData.name,
      email: cachedData.email,
      phone: cachedData.phone,
      referredBy: cachedData.referredBy,
    });
    await newUser.save();

    // Step 6: Generate JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Step 7: Clean up
    cache.del(phone);

    // Step 8: Respond
    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { phone } = req.body;
    const predefinedPhone = "9999999999";
    const predefinedOTP = "123456";

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    let user = await User.findOne({ phone });

    if (!user && phone === predefinedPhone) {
      user = await User.create({
        name: "Test User",
        email: "test@example.com",
        phone,
        role: "customer",
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ For predefined test user
    if (phone === predefinedPhone) {
      cache.set(phone, {
        phone,
        name: user.name,
        email: user.email,
        userId: user._id,
        role: user.role,
        otp: predefinedOTP, // Store the fixed OTP
      });

      return res.status(200).json({
        message: "Test OTP sent successfully",
        otp: predefinedOTP, // Optional: return in response for testing
        sessionId: "TEST_SESSION", // Dummy session ID
      });
    }

    // ✅ Normal OTP flow
    const apiKey = process.env.FACTOR_API_KEY;

    cache.set(phone, {
      phone,
      name: user.name,
      email: user.email,
      userId: user._id,
      role: user.role,
    });

    const response = await axios.get(
      `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN/OTP1`
    );

    if (response.data.Status !== "Success") {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    return res.status(200).json({
      message: "OTP sent successfully",
      sessionId: response.data.Details,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.resendLoginOTP = async (req, res) => {
  const { phone } = req.body;
  const apiKey = process.env.FACTOR_API_KEY;

  try {
    // ✅ Check if user exists (because it's a login)
    const existingUser = await User.findOne({ phone });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check if original login attempt (cache) exists
    const cachedData = cache.get(phone);
    if (!cachedData) {
      return res.status(400).json({ message: "No previous login attempt found for this number" });
    }

    // ✅ Resend OTP via 2Factor
    const response = await axios.get(
      `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN/OTP1`
    );

    if (response.data.Status !== "Success") {
      return res.status(500).json({ message: "Failed to resend OTP. Try again later." });
    }

    // ✅ Update cache if needed (optional, here it's the same)
    cache.set(phone, { ...cachedData });

    return res.status(200).json({
      message: "OTP resent successfully",
      sessionId: response.data.Details, // New session ID must be used in next verification
    });
  } catch (error) {
    console.error("Resend OTP Error:", error?.response?.data || error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { phone, otp, sessionId } = req.body;
    const predefinedPhone = "9999999999";
    const predefinedOTP = "123456";

    if (!phone || !otp || !sessionId) {
      return res.status(400).json({ message: "Phone, OTP, and Session ID are required" });
    }

    // ✅ For predefined test user
    if (phone === predefinedPhone && otp === predefinedOTP && sessionId === "TEST_SESSION") {
      const cachedData = cache.get(phone);
      if (!cachedData) {
        return res.status(400).json({ message: "Session expired. Please login again." });
      }

      const payload = { id: cachedData.userId, role: cachedData.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return res.status(200).json({
        message: "Test user logged in successfully",
        user: {
          userId: cachedData.userId,
          name: cachedData.name,
          email: cachedData.email,
          phone: cachedData.phone,
          role: cachedData.role,
        },
        accessToken,
        refreshToken,
      });
    }

    // ✅ For regular users
    const apiKey = process.env.FACTOR_API_KEY;
    const response = await axios.get(
      `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`
    );

    if (response.data.Status !== "Success") {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const cachedData = cache.get(phone);
    if (!cachedData) {
      return res.status(400).json({ message: "Session expired. Please login again." });
    }

    const payload = { id: cachedData.userId, role: cachedData.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.status(200).json({
      message: "Login successful",
      user: {
        userId: cachedData.userId,
        name: cachedData.name,
        email: cachedData.email,
        phone: cachedData.phone,
        role: cachedData.role,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error("OTP Verification Error:", error?.response?.data || error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
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

      // ✅ Generate JWT token (no expiration)
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

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
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  })(req, res, next);
};



// ✅ Android Google Login
exports.androidLoginCallback = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || "user",
        email,
        googleId: uid,
      });
    }

    // ✅ Generate JWT token (no expiration)
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

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



// ✅ Apple Login
exports.appleLoginCallback = (req, res, next) => {
  passport.authenticate("apple", { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Authentication failed", error: err.message });
    }
    try {
      let existingUser = await User.findOne({ appleId: user.appleId });

      if (!existingUser) {
        existingUser = await User.create({
          name: user.name,
          email: user.email,
          appleId: user.appleId,
        });
      }

      // ✅ Generate JWT token (no expiration)
      const token = jwt.sign({ id: existingUser._id, role: existingUser.role }, process.env.JWT_SECRET);

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


const predefinedPhone = "9999999999";
const predefinedOTP = "123456";

// Send OTP (Handles Test User & Referral Cache)
exports.sendOtp = async (req, res) => {
    try {
        const { phone, referredBy } = req.body;

        if (!phone) {
            return res.status(400).json({ message: "Phone number is required" });
        }

        let user = await User.findOne({ phone });

        // ✅ Referral check
        let referrer = null;
        if (referredBy) {
            referrer = await User.findOne({ referralCode: referredBy });
            if (!referrer) {
                return res.status(400).json({ message: "Invalid referral code" });
            }
            if (referrer.phone === phone) {
                return res.status(400).json({ message: "You cannot refer yourself" });
            }
        }

        // Cache phone & referral info (even for test user)
        cache.set(phone, { phone, referredBy });

        // ✅ Handle predefined test user
        if (phone == predefinedPhone) {
            if (!user) {
                user = await User.create({
                    name: "Test User",
                    phone,
                    role: "customer",
                });
            }

            cache.set(phone, {
                phone,
                userId: user._id,
                role: user.role,
                name: user.name,
                referredBy,
                otp: predefinedOTP,
            });

            return res.status(200).json({
                message: "Test OTP sent successfully",
                otp: predefinedOTP,
                sessionId: "TEST_SESSION",
            });
        }

        // ✅ Normal OTP flow
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN`);
        if (response.data.Status !== "Success") {
            return res.status(500).json({ message: "Failed to send OTP" });
        }

        return res.status(200).json({
            message: "OTP sent successfully",
            sessionId: response.data.Details,
        });

    } catch (error) {
        console.error("Send OTP Error:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};



// Verify OTP (Handles Test User, Referral Rewards, Anti-Abuse)
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp, sessionId, playerId } = req.body;
        if (!phone || !otp || !sessionId) 
            return res.status(400).json({ message: "Phone, OTP, and Session ID are required" });

        let user = await User.findOne({ phone });

        // ✅ Test User Flow
        if (phone == predefinedPhone && otp === predefinedOTP && sessionId === "TEST_SESSION") {
            const cachedData = cache.get(phone);
            if (!cachedData) return res.status(400).json({ message: "Session expired. Please login again." });

            // Ensure test user is active
            if (!user) {
                user = await User.create({
                    phone,
                    name: "Test User",
                    role: "customer",
                    isActive: true
                });
            } else {
                user.isActive = true;
                await user.save();
            }

            if (playerId) {
                user.playerId = playerId;
                await user.save();
            }

            const payload = { id: cachedData.userId, role: cachedData.role };
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            return res.status(200).json({
                message: "Test user logged in successfully",
                user: {
                    userId: cachedData.userId,
                    phone: cachedData.phone,
                    role: cachedData.role,
                    coins: user?.coins || 0
                },
                accessToken,
                refreshToken,
            });
        }

        // ✅ Normal OTP Verification
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/VERIFY/${sessionId}/${otp}`);
        if (response.data.Status !== "Success") {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        // ✅ Create new user if not exists (with referral logic)
        if (!user) {
            const cachedData = cache.get(phone);
            const settings = await Coin.findOne();
            const referrerReward = settings?.referralCoins || 100;
            const newUserReward = settings?.referralCoinsUser || 40;
            let referredBy = cachedData?.referredBy;

            // Anti-abuse check
            const wasDeleted = await DeletedUser.findOne({ phone });
            if (wasDeleted) referredBy = null;

            user = await User.create({
                phone,
                referredBy,
                playerId,
                isActive: true // ✅ Set active for new user
            });

            // Award referral coins if applicable
            if (referredBy) {
                const referrer = await User.findOne({ referralCode: referredBy });
                if (referrer) {
                    await referrer.creditCoins(referrerReward, user._id, 'Referral', `Referral bonus for referring ${phone}`);
                } else {
                    referredBy = null;
                }
                await user.creditCoins(newUserReward, referrer?._id, 'Referral', `Referral bonus for being referred by ${referrer?.phone || 'unknown'}`);
            }

        } else {
            // Existing user: update playerId and set active
            if (playerId) user.playerId = playerId;
            user.isActive = true; // ✅ Set active
            await user.save();
        }

        // Generate tokens
        const payload = { id: user._id, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        cache.del(phone); // Cleanup cache

        return res.status(200).json({
            message: "Login successful",
            user: {
                userId: user._id,
                phone: user.phone,
                role: user.role,
                coins: user.coins
            },
            accessToken,
            refreshToken,
        });

    } catch (error) {
        console.error("Verify OTP Error:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Resend OTP (Preserves referral info & supports Test User)
exports.resendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: "Phone number is required" });

        const cachedData = cache.get(phone) || {};
        const referredBy = cachedData.referredBy || null;

        // ✅ Test User Flow
        if (phone === predefinedPhone) {
            return res.status(200).json({
                message: "Test OTP resent successfully",
                otp: predefinedOTP,
                sessionId: "TEST_SESSION"
            });
        }

        // ✅ Normal user flow
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN`);
        if (response.data.Status !== "Success") {
            return res.status(500).json({ message: "Failed to resend OTP" });
        }

        // Preserve referral info in cache
        cache.set(phone, { ...cachedData, phone, referredBy });

        return res.status(200).json({
            message: "OTP resent successfully",
            sessionId: response.data.Details
        });
    } catch (error) {
        console.error("Resend OTP Error:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
