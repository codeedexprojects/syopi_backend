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


exports.registerVendor = async (req, res) => {
  try {
    const { files, body } = req;

    // Parse bankDetails if it's sent as a JSON string
    if (typeof body.bankDetails === "string") {
      try {
        body.bankDetails = JSON.parse(body.bankDetails);
      } catch (error) {
        return res.status(400).json({ message: "Invalid bankDetails format" });
      }
    }

    // Extract uploaded files
    const storeLogo = files.storelogo?.[0];
    const license = files.license?.[0];
    const passbookImage = files.passbookImage?.[0];
    const images = files.images || [];

    // Validate required file uploads
    if (!storeLogo || !license || !passbookImage) {
      return res.status(400).json({
        message: "Store logo, license, and passbook image are required",
      });
    }

    // Validate GST number presence
    if (!body.gstNumber) {
      return res.status(400).json({ message: "GST number is required" });
    }

    // Collect image paths
    const imagePaths = images.map((file) => file.filename);

    // Construct new vendor document
    const newVendor = new Vendor({
      ...body,
      storelogo: storeLogo.filename,
      license: license.filename,
      passbookImage: passbookImage.filename,
      gstNumber: body.gstNumber,
      images: imagePaths,
      bankDetails: {
        bankName: body.bankDetails?.bankName,
        accountNumber: body.bankDetails?.accountNumber,
        accountHolderName: body.bankDetails?.accountHolderName,
        ifscCode: body.bankDetails?.ifscCode
      }
    });

    // Save to DB
    await newVendor.save();

    res.status(201).json({
      message: "Vendor registered successfully",
      vendor: {
        id: newVendor._id,
        email: newVendor.email,
        businessname: newVendor.businessname,
        role: newVendor.role,
      },
    });
  } catch (error) {
    console.error("Register vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
