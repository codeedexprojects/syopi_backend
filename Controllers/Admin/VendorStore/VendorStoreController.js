const VendorStore = require("../../../Models/Admin/VendorStoreModel");
const Vendor = require("../../../Models/Admin/VendorModel"); 

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

exports.addVendorStore = async (req, res) => {
  try {
    const { vendorId, subcategories } = req.body;

    if (!vendorId) return res.status(400).json({ message: "vendorId is required" });

    const vendorExists = await Vendor.findById(vendorId);
    if (!vendorExists) return res.status(404).json({ message: "Vendor not found" });

    const storeExists = await VendorStore.findOne({ vendorId });
    if (storeExists) return res.status(400).json({ message: "Store already exists for this vendor" });

    const banners = req.body.banners
      ? [].concat(req.body.banners).map((banner, i) => ({
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          productIds: banner.productIds ? [].concat(banner.productIds) : [],
          image: req.files?.banners?.[i]?.filename || null,
        }))
      : [];

    const bottomBanner = req.body.bottomBanner
      ? {
          title: req.body.bottomBanner.title || "",
          subtitle: req.body.bottomBanner.subtitle || "",
          image: req.files?.bottomBanner?.[0]?.filename || null,
        }
      : null;

    const newStore = new VendorStore({
      vendorId,
      banners,
      subcategories: subcategories ? [].concat(subcategories) : [],
      bottomBanner,
    });

    await newStore.save();

    res.status(201).json({ success: true, message: "Vendor store created successfully", data: newStore });
  } catch (error) {
    console.error("Error adding vendor store:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};


exports.updateVendorStore = async (req, res) => {
  try {
    const { vendorId, subcategories } = req.body;

    if (!vendorId) return res.status(400).json({ message: "vendorId is required" });

    const vendorStore = await VendorStore.findOne({ vendorId });
    if (!vendorStore) return res.status(404).json({ message: "Vendor store not found" });

    const banners = req.body.banners
      ? [].concat(req.body.banners).map((banner, i) => ({
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          productIds: banner.productIds ? [].concat(banner.productIds) : [],
          image: req.files?.banners?.[i]?.filename || banner.image || null,
        }))
      : vendorStore.banners;

    const bottomBanner = req.body.bottomBanner
      ? {
          title: req.body.bottomBanner.title || "",
          subtitle: req.body.bottomBanner.subtitle || "",
          image: req.files?.bottomBanner?.[0]?.filename || vendorStore.bottomBanner?.image || null,
        }
      : vendorStore.bottomBanner;

    vendorStore.banners = banners;
    vendorStore.bottomBanner = bottomBanner;
    vendorStore.subcategories = subcategories ? [].concat(subcategories) : vendorStore.subcategories;

    await vendorStore.save();

    res.status(200).json({ success: true, message: "Vendor store updated successfully", data: vendorStore });
  } catch (error) {
    console.error("Error updating vendor store:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};


