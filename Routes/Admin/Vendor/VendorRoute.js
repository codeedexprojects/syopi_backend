const express = require('express');
const router = express.Router();
const vendorController = require('../../../Controllers/Admin/Vendor/VendorController');
const verifyToken = require('../../../Middlewares/jwtConfig');
const multerConfig = require('../../../Middlewares/MulterConfig');

const uploadFields = multerConfig.fields([
    { name: "images", maxCount: 5 },
    { name: "storelogo", maxCount: 1 },
    { name: "license", maxCount: 1 }
])

//create new vendor
router.post('/create',verifyToken(['admin']),uploadFields,vendorController.createVendor);

//get all vendors
router.get('/get',verifyToken(['admin']),vendorController.getAllVendors);

//get vendor by id
router.get('/get/:id',verifyToken(['admin']),vendorController.getVendorById);

//updated a vendor
router.patch('/update/:id',verifyToken(['admin']),uploadFields,vendorController.updateVendor);

//delete a vendor
router.delete('/delete/:id',verifyToken(['admin']),vendorController.deleteVendor);

// delete a vendor image
router.delete('/delete-vendor-image/:id',verifyToken(['admin']),vendorController.deleteVendorImage);

//search vendor
router.get('/search',verifyToken(['admin']),vendorController.searchVendors);

//filter based on city & storetype
router.get('/filter',verifyToken(['admin']),vendorController.filterVendor);

module.exports = router;