const Vendor = require('../../../Models/Admin/VendorModel');

//get user profile
exports.getVendorProfile = async(req,res) => {
    try {
        const vendorId = req.user.id;
        const vendor = await Vendor.findById(vendorId).select("-password");
        if(!vendor || vendor.length === 0){
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ vendor });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." })
    }
}