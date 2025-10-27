const VendorStore = require("../../../Models/Admin/VendorStoreModel");
const Vendor = require("../../../Models/Admin/VendorModel"); 

exports.getVendorStore = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const store = await VendorStore.findOne({ vendorId, isActive: true })
      .populate({
        path: "banners.productIds",
        select: "name images price offerPrice totalSales",
      })
      .populate({
        path: "bottomBanner.productIds",
        select: "name images price offerPrice totalSales",
      })
      .populate({
        path: "subcategories",
        select: "name image",
      })
      .populate({
        path: "vendorId",
        select: "businessname storelogo city",
      });

    if (!store) {
      return res.status(404).json({ message: "Vendor store not found or inactive" });
    }

    res.status(200).json({ success: true, data: store });

  } catch (error) {
    console.error("Error fetching vendor store:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



exports.getAllVendorStores = async (req, res) => {
  try {
    const stores = await VendorStore.find({isActive: true})
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
