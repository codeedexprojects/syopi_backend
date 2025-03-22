const Vendor = require('../../../Models/Admin/VendorModel');
const path = require('path');
const fs = require('fs');

//create new vendor
exports.createVendor = async (req, res) => {
    try {
        const { files, body } = req;

        // Parse bankDetails if it's a string
        if (typeof body.bankDetails === "string") {
            try {
                body.bankDetails = JSON.parse(body.bankDetails);
            } catch (error) {
                return res.status(400).json({ message: "Invalid bankDetails format" });
            }
        }

        // Extract images
        const images = files.images;
        const storeLogo = files.storelogo ? files.storelogo[0] : null;
        const license = files.license ? files.license[0] : null;

        // Validations
        if (!storeLogo) {
            return res.status(400).json({ message: "Store logo is required" });
        }
        if (!license) {
            return res.status(400).json({ message: "License is required" });
        }
        if (!images) {
            return res.status(400).json({ message: "At least one vendor image is required" });
        }
        if (!body.bankDetails.bankName || !body.bankDetails.accountNumber || 
            !body.bankDetails.accountHolderName || !body.bankDetails.ifscCode) {
            return res.status(400).json({ message: "All bank details (bankName, accountNumber, accountHolderName, ifscCode) are required" });
        }

        // Process image filenames
        const imagePaths = images.map((file) => file.filename);

        // Create new vendor
        const newVendor = new Vendor({
            ...body,
            storelogo: storeLogo.filename,
            license: license.filename,
            images: imagePaths,
            bankDetails: {
                bankName: body.bankDetails.bankName,
                accountNumber: body.bankDetails.accountNumber,
                accountHolderName: body.bankDetails.accountHolderName,
                ifscCode: body.bankDetails.ifscCode
            }
        });

        await newVendor.save();
        res.status(201).json({ message: "Vendor created successfully", vendor: newVendor });

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
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
        res.status(200).json(vendor);
    } catch (error) {
        res.status(500).json({message: 'Error fetching vendor',error: error.message});
    }
}

// update vendor
exports.updateVendor = async (req, res) => {
    const { id } = req.params;
    try {
        const vendor = await Vendor.findById(id);
        if (!vendor) {
            return res.status(404).json({ message: "Vendor not found" });
        }

        // Parse bankDetails if it's sent as a JSON string
        if (req.body.bankDetails && typeof req.body.bankDetails === "string") {
            try {
                req.body.bankDetails = JSON.parse(req.body.bankDetails);
            } catch (error) {
                return res.status(400).json({ message: "Invalid bankDetails format" });
            }
        }

        // Handle images
        const images = req.files?.images || [];
        const existingImages = vendor.images || [];
        const newImages = images.map((file) => file.filename);

        // Ensure no more than 5 images in total
        if (existingImages.length + newImages.length > 5) {
            return res.status(400).json({ message: "Cannot have more than 5 images for a vendor" });
        }

        // Delete old store logo if a new one is uploaded
        if (req.files?.storelogo?.[0]) {
            const oldStoreLogoPath = path.join(__dirname, "../uploads/admin/vendor", vendor.storelogo);
            if (fs.existsSync(oldStoreLogoPath)) {
                fs.unlinkSync(oldStoreLogoPath);
            }
            vendor.storelogo = req.files.storelogo[0].filename;
        }

        // Delete old license if a new one is uploaded
        if (req.files?.license?.[0]) {
            const oldLicensePath = path.join(__dirname, "../uploads/admin/vendor", vendor.license);
            if (fs.existsSync(oldLicensePath)) {
                fs.unlinkSync(oldLicensePath);
            }
            vendor.license = req.files.license[0].filename;
        }

        // Merge and validate bank details
        const updatedBankDetails = {
            bankName: req.body.bankDetails?.bankName || vendor.bankDetails?.bankName,
            accountNumber: req.body.bankDetails?.accountNumber || vendor.bankDetails?.accountNumber,
            accountHolderName: req.body.bankDetails?.accountHolderName || vendor.bankDetails?.accountHolderName,
            ifscCode: req.body.bankDetails?.ifscCode || vendor.bankDetails?.ifscCode,
        };

        // Validate bank details only if provided
        if (req.body.bankDetails) {
            if (!updatedBankDetails.bankName || !updatedBankDetails.accountNumber ||
                !updatedBankDetails.accountHolderName || !updatedBankDetails.ifscCode) {
                return res.status(400).json({ message: "All bank details (bankName, accountNumber, accountHolderName, ifscCode) must be provided" });
            }
        }

        // Prepare updated vendor data
        const updatedVendorData = {
            ...req.body,
            images: [...existingImages, ...newImages],
            storelogo: vendor.storelogo,
            license: vendor.license,
            bankDetails: updatedBankDetails,
        };

        // Update vendor
        const updatedVendor = await Vendor.findByIdAndUpdate(id, updatedVendorData, { new: true, runValidators: true });

        res.status(200).json({
            message: "Vendor updated successfully",
            updatedVendor,
        });

    } catch (error) {
        res.status(500).json({ message: "Error updating vendor", error: error.message });
    }
};

//delete Vendor
exports.deleteVendor = async(req,res) => {
    const { id } = req.params;
    try {
        const vendor = await Vendor.findById(id);
        if(!vendor){
            return res.status(404).json({ message: 'vendor not found' })
        }
        // Delete associated images
        const basePath = path.join('./uploads/admin/product');
        const imagePaths = vendor.images.map((image) => path.join(basePath, image));

        imagePaths.forEach((imagePath) => {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Delete each image file
            }  
        });
        await Vendor.findByIdAndDelete(id);
        res.status(200).json({ message: 'vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting vendor', error: error.message });
    }
}

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