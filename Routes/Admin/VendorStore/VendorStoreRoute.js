const express = require("express");
const router = express.Router();
const vendorStoreController = require("../../../Controllers/Admin/VendorStore/VendorStoreController");
const multerConfig = require("../../../Middlewares/MulterConfig");
const upload = multerConfig.any()

router.post("/upsert", upload, vendorStoreController.upsertVendorStore);

router.get("/:vendorId", vendorStoreController.getVendorStore);

router.get("/", vendorStoreController.getAllVendorStores);

module.exports = router;
