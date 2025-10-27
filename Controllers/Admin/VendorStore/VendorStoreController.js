const VendorStore = require("../../../Models/Admin/VendorStoreModel");
const Vendor = require("../../../Models/Admin/VendorModel"); 
const fs = require("fs");
const path = require("path");

exports.getVendorStore = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const store = await VendorStore.findOne({ vendorId })
      .populate({
        path: "banners.productIds",
        select: "name images price offerPrice totalSales",
      })
      .populate({
        path: "subcategories",
        select: "name image",
      })
      .populate({
        path: "bottomBanner.productIds",
        select: "name images price offerPrice totalSales",
      });      

    if (!store) {
      return res.status(404).json({ message: "Vendor store not found" });
    }

    res.status(200).json({ success: true, data: store });
  } catch (error) {
    console.error("Error fetching vendor store:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

exports.getAllVendorStores = async (req, res) => {
  try {
    const stores = await VendorStore.find()
      .populate("vendorId", "businessname storelogo city");

    res.status(200).json({ success: true, count: stores.length, data: stores });
  } catch (error) {
    console.error("Error fetching vendor stores:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

exports.addVendorStore = async (req, res) => {
  try {
    const { vendorId, subcategories, background } = req.body;

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
          productIds: req.body.bottomBanner.productIds ? [].concat(req.body.bottomBanner.productIds) : [],
          image: req.files?.bottomBanner?.[0]?.filename || null,
        }
      : null;

    const bg = background
      ? {
          title: background.title || "",
          subtitle: background.subtitle || "",
          image: req.files?.background?.[0]?.filename || null,
        }
      : null;

    const newStore = new VendorStore({
      vendorId,
      banners,
      subcategories: subcategories ? [].concat(subcategories) : [],
      bottomBanner,
      background: bg,
    });

    await newStore.save();

    res.status(201).json({ success: true, message: "Vendor store created successfully", data: newStore });
  } catch (error) {
    console.error("Error adding vendor store:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

// ✅ Update Vendor Store
exports.updateVendorStore = async (req, res) => {
  try {
    const { vendorId } = req.params;
    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    const vendorStore = await VendorStore.findOne({ vendorId });
    if (!vendorStore) {
      return res.status(404).json({ message: "Vendor store not found" });
    }

    const body = req.body;

    if (body.subcategories) {
      vendorStore.subcategories = [].concat(body.subcategories);
    }

    if (body.banners) {
      vendorStore.banners = [].concat(body.banners).map((banner, i) => ({
        title: banner.title ?? vendorStore.banners?.[i]?.title ?? "",
        subtitle: banner.subtitle ?? vendorStore.banners?.[i]?.subtitle ?? "",
        productIds: banner.productIds ? [].concat(banner.productIds) : vendorStore.banners?.[i]?.productIds ?? [],
        image: req.files?.banners?.[i]?.filename || vendorStore.banners?.[i]?.image || null,
      }));
    }

    if (body.bottomBanner) {
      vendorStore.bottomBanner = {
        title: body.bottomBanner.title ?? vendorStore.bottomBanner?.title ?? "",
        subtitle: body.bottomBanner.subtitle ?? vendorStore.bottomBanner?.subtitle ?? "",
        productIds: body.bottomBanner.productIds
          ? [].concat(body.bottomBanner.productIds)
          : vendorStore.bottomBanner?.productIds ?? [],
        image: req.files?.bottomBanner?.[0]?.filename || vendorStore.bottomBanner?.image || null,
      };
    }

    if (body.background) {
      vendorStore.background = {
        title: body.background.title ?? vendorStore.background?.title ?? "",
        subtitle: body.background.subtitle ?? vendorStore.background?.subtitle ?? "",
        image: req.files?.background?.[0]?.filename || vendorStore.background?.image || null,
      };
    }
    await vendorStore.save();

    res.status(200).json({
      success: true,
      message: "Vendor store updated successfully",
      data: vendorStore,
    });

  } catch (error) {
    console.error("Error updating vendor store:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


exports.toggleVendorStoreStatus = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const store = await VendorStore.findOne({ vendorId });
    if (!store) return res.status(404).json({ message: "Vendor store not found" });

    store.isActive = !store.isActive;
    await store.save();

    res.status(200).json({
      success: true,
      message: `Store is now ${store.isActive ? "Active" : "Inactive"}`,
      data: store,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.deleteVendorStore = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    const store = await VendorStore.findOne({ vendorId });
    if (!store) {
      return res.status(404).json({ message: "Vendor store not found" });
    }

    const deleteImage = (fileName) => {
      if (!fileName) return;
      const filePath = path.join("uploads", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    if (store.banners?.length > 0) {
      store.banners.forEach((b) => deleteImage(b.image));
    }

    if (store.bottomBanner?.image) {
      deleteImage(store.bottomBanner.image);
    }

    if (store.background?.image) {
      deleteImage(store.background.image);
    }

    await VendorStore.deleteOne({ vendorId });

    return res.status(200).json({
      success: true,
      message: "Vendor store deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting vendor store:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
