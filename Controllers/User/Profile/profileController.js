const User = require('../../../Models/User/UserModel');
const path = require('path');
const Vendor = require('../../../Models/Admin/VendorModel')
const DeletedUser = require('../../../Models/User/deletedUserModel')

//get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user has registered as a vendor
    const vendor = await Vendor.findOne({ userId }).select("status");

    const userProfile = {
      ...user.toObject(),
      vendorStatus: vendor ? vendor.status : null, // 'pending', 'approved', 'rejected' or null if not registered
    };

    res.status(200).json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


// update userData
exports.updateUserData = async(req,res) => {
    try {
        if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
            return res.status(400).json({ message: "No data provided for update" });
          }
          const updatedData = { ...req.body };
          if (req.file && req.file.filename) {
            updatedData.image = req.file.filename;
          }else if (req.body.image) {
            updatedData.image = path.basename(req.body.image); 
          }
        const userId = req.user.id;
        const updatedUser = await User.findByIdAndUpdate(userId,updatedData,{ new: true, runValidators: true}).select("-password");
        if(!updatedUser || updatedUser.length === 0){
            return res.status(404).json({ message: "user not found" })
        }

        res.status(200).json({ message: 'user updated successfully', updatedUser })
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
}
// Delete user account
exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Store deleted data in DeletedUser model
    await DeletedUser.create({
      phone: user.phone,
      email: user.email,
      referredBy: user.referredBy,
    });

    // Hard delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User account permanently deleted and archived" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
};


// Register vendor
exports.registerVendor = async (req, res) => {
  try {
    const { files, body, user } = req;

    // Ensure user is logged in
    if (!user || !user.id) {
      return res.status(401).json({ message: "User authentication required" });
    }
    
    // Check for existing vendor by email or number
    const existingVendor = await Vendor.findOne({
      $or: [{ email: body.email }, { number: body.number }],
    });
    if (existingVendor) {
      return res.status(409).json({
        message: "Vendor with this email or phone number already exists",
      });
    }

    // Parse bankDetails if it's a string
    if (typeof body.bankDetails === "string") {
      try {
        body.bankDetails = JSON.parse(body.bankDetails);
      } catch (error) {
        return res.status(400).json({ message: "Invalid bankDetails format" });
      }
    }

    // File extraction
    const storeLogo = files.storelogo?.[0];
    const license = files.license?.[0];
    const passbookImage = files.passbookImage?.[0];
    const displayImages = files.images || [];

    // Validate essential files
    if (!storeLogo || !passbookImage) {
      return res.status(400).json({
        message: "Store logo, and passbook image are required",
      });
    }

    const imagePaths = displayImages.map((img) => img.filename);

    // Create new vendor document
    const newVendor = new Vendor({
      ...body,
      storelogo: storeLogo.filename,
      license: license ? license.filename : null,
      passbookImage: passbookImage.filename,
      images: imagePaths,
      gstNumber: body.gstNumber || null,
      userId: user.id, 
      bankDetails: {
        bankName: body.bankDetails?.bankName,
        accountNumber: body.bankDetails?.accountNumber,
        accountHolderName: body.bankDetails?.accountHolderName,
        ifscCode: body.bankDetails?.ifscCode,
      },
    });

    await newVendor.save();

    return res.status(201).json({
      message: "Vendor registration submitted successfully",
      vendor: {
        id: newVendor._id,
        email: newVendor.email,
        businessname: newVendor.businessname,
        status: newVendor.status,
      },
    });
  } catch (error) {
    console.error("Vendor registration error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id; 
    if (!userId) {
      return res.status(400).json({ success: false, message: "Invalid request. User not found." });
    }

    await User.findByIdAndUpdate(userId, { isActive: false });
    
    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });

  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};