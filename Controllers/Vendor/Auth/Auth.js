const Vendor = require('../../../Models/Admin/VendorModel');
const { generateAccessToken, generateRefreshToken } = require('../../../utils/tokenUtils');
const bcrypt = require('bcrypt');
const axios = require('axios');
const cache = new Map(); 
const api_key = process.env.FACTOR_API_KEY;

//login vendor
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingVendor = await Vendor.findOne({ email });

    if (!existingVendor) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, existingVendor.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Check vendor status before issuing token
    if (existingVendor.status === "pending") {
      return res.status(403).json({
        message: "Your account is under review. You'll be notified once it's approved.",
      });
    }

    if (existingVendor.status === "rejected") {
      return res.status(403).json({
        message: "Your vendor registration was rejected. Please contact support.",
      });
    }

    if (existingVendor.status === "blocked") {
      return res.status(403).json({
        message: "Your are blocked. Please contact support.",
      });
    }

    const payload = { id: existingVendor._id, role: existingVendor.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return res.status(200).json({
      message: "Vendor logged in successfully.",
      vendorId: existingVendor._id,
      role: existingVendor.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message });
  }
};


exports.sendOtpVendor = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: "Phone number is required" });

        const vendor = await Vendor.findOne({ number: phone });
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        // Save vendorId in cache for password reset verification
        cache.set(phone, { vendorId: vendor._id, phone });

        // Send OTP using 2Factor API
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN`);
        if (response.data.Status !== "Success") {
            return res.status(500).json({ message: "Failed to send OTP" });
        }

        return res.status(200).json({
            message: "OTP sent successfully",
            sessionId: response.data.Details
        });

    } catch (error) {
        console.error("Send OTP Vendor Error:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.verifyOtpVendor = async (req, res) => {
    try {
        const { phone, otp, sessionId, newPassword } = req.body;
        if (!phone || !otp || !sessionId || !newPassword) {
            return res.status(400).json({ message: "Phone, OTP, Session ID, and New Password are required" });
        }

        const cachedData = cache.get(phone);
        if (!cachedData) return res.status(400).json({ message: "Session expired. Please try again." });

        const vendor = await Vendor.findById(cachedData.vendorId);
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });

        const oldPassword = await bcrypt.compare(newPassword, vendor.password);
        if (oldPassword) {
          return res.status(401).json({ message: "New password same as old password" });
        }

        // Verify OTP using 2Factor API
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/VERIFY/${sessionId}/${otp}`);
        if (response.data.Status !== "Success") {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        // Update password
        vendor.password = newPassword
        await vendor.save();

        cache.delete(phone);
        return res.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        console.error("Verify OTP Vendor Error:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.resendOtpVendor = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: "Phone number is required" });

        const cachedData = cache.get(phone);
        if (!cachedData) return res.status(404).json({ message: "Vendor not found or session expired" });

        // Resend OTP using 2Factor API
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN`);
        if (response.data.Status !== "Success") {
            return res.status(500).json({ message: "Failed to resend OTP" });
        }

        cache.set(phone, { ...cachedData, phone }); // refresh cache
        return res.status(200).json({
            message: "OTP resent successfully",
            sessionId: response.data.Details
        });

    } catch (error) {
        console.error("Resend OTP Vendor Error:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};








