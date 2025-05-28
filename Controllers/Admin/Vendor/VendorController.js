const Vendor = require('../../../Models/Admin/VendorModel');
const Product = require('../../../Models/Admin/productModel')
const path = require('path');
const fs = require('fs');

//create new vendor
exports.createVendor = async (req, res) => {
  try {
    const { files, body } = req;
    if (typeof body.bankDetails === "string") {
            try {
                body.bankDetails = JSON.parse(body.bankDetails);
            } catch (error) {
                return res.status(400).json({ message: "Invalid bankDetails format" });
            }
    }

    const storeLogo = files.storelogo?.[0];
    const license = files.license?.[0];
    const passbookImage = files.passbookImage?.[0];
    const images = files.images || [];

    if (!storeLogo || !license || !passbookImage) {
      return res.status(400).json({ message: "Store logo, license, and passbook image are required" });
    }

    if (!body.gstNumber) {
      return res.status(400).json({ message: "GST number is required" });
    }

    const imagePaths = images.map((file) => file.filename);

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

    await newVendor.save();
    res.status(201).json({ message: "Vendor created successfully", vendor: newVendor });
  } catch (error) {
    console.error("Create vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



//get all vendors
exports.getAllVendors = async(req,res) => {
    try {
        const vendors = await Vendor.find();
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({message: 'Error fetching vendors', error:error.message})
    }
}

// get vendor by id
exports.getVendorById = async(req,res) => {
    const { id } = req.params;
    try {
        const vendor = await Vendor.findById(id);
        if(!vendor){
            return res.status(404).json({ message: "vendor not found" });
        }

        const products = await Product.find({owner:id, ownerType:"vendor"})

        res.status(200).json({
            vendor,
            products
        });
    } catch (error) {
        res.status(500).json({message: 'Error fetching vendor',error: error.message});
    }
}

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const newImages = req.files?.images?.map(file => file.filename) || [];
    const existingImages = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : req.body.existingImages
        ? [req.body.existingImages]
        : [];

    const oldImages = vendor.images.filter(img => !existingImages.includes(img));
    oldImages.forEach(img => {
      const imagePath = path.join(__dirname, "../uploads/admin/vendor", img);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    });

    // Handle updated files
    if (req.files?.storelogo?.[0]) {
      const logoPath = path.join(__dirname, "../uploads/admin/vendor", vendor.storelogo);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
      vendor.storelogo = req.files.storelogo[0].filename;
    }

    if (req.files?.license?.[0]) {
      const licensePath = path.join(__dirname, "../uploads/admin/vendor", vendor.license);
      if (fs.existsSync(licensePath)) fs.unlinkSync(licensePath);
      vendor.license = req.files.license[0].filename;
    }

    if (req.files?.passbookImage?.[0]) {
      const passbookPath = path.join(__dirname, "../uploads/admin/vendor", vendor.passbookImage);
      if (fs.existsSync(passbookPath)) fs.unlinkSync(passbookPath);
      vendor.passbookImage = req.files.passbookImage[0].filename;
    }

    const updatedBankDetails = {
      bankName: req.body.bankDetails?.bankName || vendor.bankDetails.bankName,
      accountNumber: req.body.bankDetails?.accountNumber || vendor.bankDetails.accountNumber,
      accountHolderName: req.body.bankDetails?.accountHolderName || vendor.bankDetails.accountHolderName,
      ifscCode: req.body.bankDetails?.ifscCode || vendor.bankDetails.ifscCode
    };

    const updatedVendorData = {
      ...req.body,
      images: [...existingImages, ...newImages],
      storelogo: vendor.storelogo,
      license: vendor.license,
      passbookImage: vendor.passbookImage,
      gstNumber: req.body.gstNumber || vendor.gstNumber,
      bankDetails: updatedBankDetails,
    };

    const updatedVendor = await Vendor.findByIdAndUpdate(req.params.id, updatedVendorData, { new: true });
    res.status(200).json({ message: "Vendor updated successfully", vendor: updatedVendor });

  } catch (error) {
    console.error("Update vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const basePath = path.join(__dirname, "../uploads/admin/vendor");

    [vendor.storelogo, vendor.license, vendor.passbookImage, ...vendor.images].forEach((file) => {
      const filePath = path.join(basePath, file);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await vendor.deleteOne();
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// delete a specific image by name
exports.deleteVendorImage = async (req,res) =>{
    try {
        const { id } = req.params;
        const { imageName } = req.body;
        const vendor = await Vendor.findById(id);
        if(!vendor){
            return res.status(404).json({ message: "vendor not found" });
        }
        const imgExists = vendor.images.filter((img) => {
            const imgFileName = img.split("\\").pop().split("/").pop();
            return imgFileName === imageName;
        })
        if(!imgExists){
            return res.status(400).json({ message: "Image not found in vendor" });
        }
         // Use $pull to remove the image directly in the database
        const updatedVendor = await Vendor.findByIdAndUpdate(
        id,
        { $pull: { images: { $regex: new RegExp(imageName, "i") } } },
        { new: true });
        res.status(200).json({ message: "Image deleted successfully", images: updatedVendor.images });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// search category by name
exports.searchVendors = async (req, res) => {
    const { ownername,city } = req.query;
    try {
        const query = {};
        if(ownername) {
            query.ownername = { $regex: ownername, $options: 'i' }; 
        }
        if(city){
            query.city = { $regex: city, $options: 'i' };
        }
        const vendors = await Vendor.find(query);
        res.status(200).json(vendors);
    } catch (err) {
        res.status(500).json({ message: 'Error searching vendors', error: err.message });
    }
};

//filter based on city & storetype
exports.filterVendor = async(req,res) => {
    try {
        const { city,storetype } = req.body;
        const query = {};
        if(city){
            query.city = { $regex: city, $options: "i" };
        }
        if(storetype){
            query.storetype = { $regex: storetype, $options: "i" }
        }
        const vendors = await Vendor.find(query);
        if(!vendors || vendors.length === 0 ){
            return res.status(400).json({ message: "No Vendor found" })
        }
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Error filter vendors', error: err.message });
    }
}