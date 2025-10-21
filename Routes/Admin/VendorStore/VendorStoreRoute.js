const express = require("express");
const router = express.Router();
const vendorStoreController = require("../../../Controllers/Admin/VendorStore/VendorStoreController");
const upload = require("../../../Middlewares/MulterConfig");

router.post(
  "/add",
  upload.fields([
    { name: "banners", maxCount: 5 },
    { name: "bottomBanner", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  vendorStoreController.addVendorStore
);

router.put(
  "/update",
  upload.fields([
    { name: "banners", maxCount: 5 },
    { name: "bottomBanner", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  vendorStoreController.updateVendorStore
);

router.get("/:vendorId", vendorStoreController.getVendorStore);

router.get("/", vendorStoreController.getAllVendorStores);

module.exports = router;
