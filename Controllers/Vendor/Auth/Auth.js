const Vendor = require('../../../Models/Admin/VendorModel');
const { generateAccessToken, generateRefreshToken } = require('../../../utils/tokenUtils');
const bcrypt = require('bcrypt');

//login vendor
exports.login = async(req,res) => {
    const { email,password } = req.body;
    try {
        const existingVendor = await Vendor.findOne({email});
        
        if(!existingVendor){
            return res.status(401).json({ message: "Invalid email or password" });
        }
        console.log(password);
        console.log("bijith")
        console.log(existingVendor.password);
        const isPasswordValid = await bcrypt.compare(password,existingVendor.password);
        console.log(isPasswordValid);
        if(!isPasswordValid){
            return res.status(401).json({ message: "Invalid email or password" })
        }

        const payload = { id: existingVendor._id, role: existingVendor.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        return res.status(200).json({
            message: "Vendor Logined successfully.",
            vendorId: existingVendor._id,
            role:existingVendor.role,
            accessToken,
            refreshToken
        });

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}