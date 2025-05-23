const User = require('../../../Models/User/UserModel');
const path = require('path');

//get user profile
exports.getUserProfile = async(req,res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        if(!user || user.length === 0){
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." })
    }
}

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
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting account", error: error.message });
    }
};
