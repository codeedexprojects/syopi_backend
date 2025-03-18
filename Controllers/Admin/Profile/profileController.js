const Admin = require('../../../Models/Admin/AdminModel');

//get admin profile
exports.getAdminProfile = async(req,res) => {
    try {
        const adminId = req.user.id;
        const admin = await Admin.findById(adminId).select("-password");
        if(!admin || admin.length === 0){
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ admin });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." })
    }
}

// update userData
exports.updateAdminData = async(req,res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "No data provided for update" });
        }
        const adminId = req.user.id;
        const updatedAdmin = await Admin.findByIdAndUpdate(adminId,req.body,{ new: true, runValidators: true}).select("-password");
        if(!updatedAdmin || updatedAdmin.length === 0){
            return res.status(404).json({ message: "admin not found" })
        }

        res.status(200).json({ message: 'admin updated successfully', updatedAdmin })
    } catch (error) {
        res.status(500).json({ message: 'Error updating admin', error: error.message });
    }
}