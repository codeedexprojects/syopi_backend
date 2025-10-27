const express = require("express");
const router = express.Router();
const vendorStoreController = require("../../../Controllers/User/VendorStore/vendorStoreController");


router.get("/:vendorId", vendorStoreController.getVendorStore);

router.get("/", vendorStoreController.getAllVendorStores);

module.exports = router;
