const Vendor = require('../../../Models/Admin/VendorModel');
const { generateAccessToken, generateRefreshToken } = require('../../../utils/tokenUtils');
const bcrypt = require('bcrypt');

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







