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

router.patch(
  "/update/:vendorId",
  upload.fields([
    { name: "banners", maxCount: 5 },
    { name: "bottomBanner", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  vendorStoreController.updateVendorStore
);

router.get("/:vendorId", vendorStoreController.getVendorStore);

router.get("/", vendorStoreController.getAllVendorStores);

router.patch("/toggle-status/:vendorId", vendorStoreController.toggleVendorStoreStatus);

router.delete("/:vendorId", vendorStoreController.deleteVendorStore);

router.delete("/:vendorId/banner/:bannerId", vendorStoreController.deleteVendorBanner);


module.exports = router;
