const User = require('../../../Models/User/UserModel');

// get all users
exports.getAllUsers = async(req,res) => {
    try {
        const users = await User.find().select("-password");
        if(!users){
            return res.status(404).json({ message: "users not found" });
        }
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

//search users
exports.searchUsers = async(req,res) => {
    const { name,phone } = req.query;
    try {
        const query = {};
        if(name){
            query.name = { $regex: name, $options: "i" }
        };
        if(phone){
            query.phone = { $regex: phone, $options: "i" }
        };
        const users = await User.find(query).select("-password");
        if(users.length === 0){
            return res.status(404).json("No users found")
        }
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ message: "Error searching users", error:error.message })
    }
}