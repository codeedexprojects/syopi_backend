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

exports.updateVendorProfile = async (req, res) => {
    try {
        const vendorId = req.user.id;

        // Fields allowed for update
        const allowedUpdates = [
            "ownername", "email", "businessname", "businesslocation", "businesslandmark",
            "number", "address", "city", "state", "pincode", "storelogo", "license",
            "images", "description", "storetype", "bankDetails", "gstNumber", "passbookImage"
        ];

        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        // Handle file uploads (if any)
        if (req.files) {
            if (req.files.storelogo) updates.storelogo = req.files.storelogo[0].filename;
            if (req.files.license) updates.license = req.files.license[0].filename;
            if (req.files.passbookImage) updates.passbookImage = req.files.passbookImage[0].filename;
            if (req.files.images) updates.images = req.files.images.map(file => file.filename);
        }

        // Update vendor
        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedVendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", vendor: updatedVendor });

    } catch (error) {
        console.error("Update Vendor Profile Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
