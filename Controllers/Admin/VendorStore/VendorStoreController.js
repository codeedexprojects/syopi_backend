const VendorStore = require("../../../Models/Admin/VendorStoreModel");
const Vendor = require("../../../Models/Admin/VendorModel"); 

// ✅ Create or Update Vendor Store
exports.upsertVendorStore = async (req, res) => {
  try {
    const { vendorId, banners, subcategories, bottomBanner } = req.body;
    
    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    const vendorExists = await Vendor.findById(vendorId);
    if (!vendorExists) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const updatedStore = await VendorStore.findOneAndUpdate(
      { vendorId },
      { banners, subcategories, bottomBanner },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Vendor store data saved successfully",
      data: updatedStore,
    });
  } catch (error) {
    console.error("Error saving vendor store:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ✅ Get Vendor Store by Vendor ID
exports.getVendorStore = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const store = await VendorStore.findOne({ vendorId })
      .populate({
        path: "banners.productIds",
        select: "name images price offerPrice totalSales",
      })
      .populate({
        path: "subcategories.subcategoryId",
        select: "name image",
      });

    if (!store) {
      return res.status(404).json({ message: "Vendor store not found" });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error("Error fetching vendor store:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ✅ Get All Vendor Stores (for admin or home page)
exports.getAllVendorStores = async (req, res) => {
  try {
    const stores = await VendorStore.find()
      .populate("vendorId", "businessname storelogo city");

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    console.error("Error fetching vendor stores:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
