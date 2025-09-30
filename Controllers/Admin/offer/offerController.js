// offerController.js
const Offer = require("../../../Models/Admin/offerModel");
const Product = require("../../../Models/Admin/productModel");
const Category = require("../../../Models/Admin/CategoryModel");
const SubCategory = require("../../../Models/Admin/SubCategoryModel")
const mongoose = require('mongoose')
const removeExpiredOffers = require("../../../utils/removeExpiredOffers")
const Brand = require("../../../Models/Admin/BrandModel");
const DiscountSettings = require('../../../Models/Admin/DiscountModel');


//apply offer
const applyOfferToProducts = async (offer) => {
  const { _id: offerId, category, subcategory, brands, products, offerType, amount, expireDate } = offer;

  if (offer.status !== "active") throw new Error("Offer is not active.");
  if (new Date() > expireDate) throw new Error("Offer has expired.");
  
  const applicableProducts = await Product.find({
    $or: [
      { _id: { $in: products } },
      { category: { $in: category } },
      { subcategory: { $in: subcategory } },
      { brand: { $in: brands } },
    ],
  });

  if (applicableProducts.length === 0) {
    throw new Error("No applicable products found for this offer.");
  }

  for (const product of applicableProducts) {
    if (product.offers) {
      const existingOffer = await Offer.findById(product.offers);
      if (existingOffer) {
        await removeOfferFromProducts(existingOffer, [product._id]);
      }
    }

    let minOfferPrice = Infinity;

    for (const variant of product.variants) {
      if (!variant.wholesalePrice || variant.wholesalePrice <= 0) continue;

      if (offerType === "percentage") {
        const discount = (variant.wholesalePrice * amount) / 100;
        variant.offerPrice = Math.max(0, variant.wholesalePrice - discount);
      } else if (offerType === "fixed") {
        variant.offerPrice = Math.max(0, variant.wholesalePrice - amount);
      }

      minOfferPrice = Math.min(minOfferPrice, variant.offerPrice);
    }

    product.offerPrice = minOfferPrice;
    product.offers = offerId;

    await product.save();
  }

  console.log(`Offer applied to ${applicableProducts.length} products.`);
};



// remove offer
const removeOfferFromProducts = async (offer, productIds = []) => {
  const { _id: offerId, ownerId, ownerType } = offer;

  // Find products with the current offer
  const query = {
    owner: ownerId,
    ownerType,
    offers: offerId,
  };

  // If specific product IDs are provided, only target those products
  if (productIds.length > 0) {
    query._id = { $in: productIds };
  }

  const applicableProducts = await Product.find(query);

  // Reset offer prices for each product
  for (const product of applicableProducts) {
    product.offers = null;

    // Reset offer price to original price for all variants
    product.variants.forEach((variant) => {
      variant.offerPrice = variant.price;
    });

    // Update product's overall offer price to the lowest variant price
    product.offerPrice = Math.min(...product.variants.map((v) => v.price));

    await product.save();
  }

  console.log(`Offer removed and prices reset for ${applicableProducts.length} products.`);
};



// Create Offer
exports.createOffer = async (req, res) => {
  try {
    const { offerName, ownerId, offerType, amount, startDate, expireDate, category, subcategory, brand, products } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid offer amount. It must be greater than 0." });
    }

    const ownerType = req.user.role;
    const createdBy = req.user._id;

    const newOffer = new Offer({
      offerName,
      offerType,
      amount,
      startDate,
      expireDate,
      category: category ? category.map((id) => new mongoose.Types.ObjectId(id)) : [],
      subcategory: subcategory ? subcategory.map((id) => new mongoose.Types.ObjectId(id)) : [],
      brands: brand ? brand.map((id) => new mongoose.Types.ObjectId(id)) : [],
      products: products ? products.map((id) => new mongoose.Types.ObjectId(id)) : [],
      createdBy,
      ownerType,
      ownerId,
    });
    

    await newOffer.save();
    await applyOfferToProducts(newOffer);

    if (brand && brand.length > 0) {
      await Brand.updateMany(
        { _id: { $in: brand.map((id) => new mongoose.Types.ObjectId(id)) } },
        { $set: { discount: newOffer._id } }
      );
    }

    res.status(201).json({ message: "Offer created and applied successfully", offer: newOffer });
  } catch (error) {
    res.status(500).json({ message: "Error creating offer", error: error.message });
  }
};


// Get All Offers with Filtering
exports.getOffers = async (req, res) => {
  try {
    const { ownerId, category, subcategory, brands, status } = req.query;
    let filter = {};

    if (ownerId) filter.ownerId = ownerId;
    if (category) filter.category = { $in: category.split(",") };
    if (subcategory) filter.subcategory = { $in: subcategory.split(",") };
    if (brands) filter.brand = { $in: brand.split(",") };
    if (status) filter.status = status;

    const offers = await Offer.find(filter)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("brands", "name")
      .populate("products", "name")
      .populate("createdBy", "role")
      .sort({ startDate: 1 });

    res.status(200).json({ offers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching offers", error: error.message });
  }
};



// Get Offer by ID
exports.getOfferById = async (req, res) => {
  const { id } = req.params;

  try {
    const offer = await Offer.findById(id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("products", "name")
      .populate("createdBy", "role");

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.status(200).json({ offer });
  } catch (error) {
    res.status(500).json({ message: "Error fetching offer", error: error.message });
  }
};

// Update Offer
exports.updateOffer = async (req, res) => {
  const { id } = req.params;
  const { offerName, offerType, amount, startDate, expireDate, category, subcategory, status } = req.body;

  try {
    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      {
        ...(offerName && { offerName }),
        ...(offerType && { offerType }),
        ...(amount && { amount }),
        ...(startDate && { startDate }),
        ...(expireDate && { expireDate }),
        ...(category && { category }),
        ...(subcategory && { subcategory }),
        ...(status && { status }),
      },
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Reapply offer to products if updated
    await applyOfferToProducts(updatedOffer);

    res.status(200).json({ message: "Offer updated successfully", offer: updatedOffer });
  } catch (error) {
    res.status(500).json({ message: "Error updating offer", error: error.message });
  }
};

// Delete Offer
exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findById(id);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Ensure only the creator can delete the offer
    if (String(offer.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You do not have permission to delete this offer." });
    }

    
    // Remove the offer from all applicable products
    await removeOfferFromProducts(offer);
    // Delete the offer from the database
    await Offer.findByIdAndDelete(id);

    res.status(200).json({ message: "Offer deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting offer", error: error.message });
  }
};

// Manually trigger the expired offer cleanup
exports.triggerOfferCleanup = async (req, res) => {
  try {
    await removeExpiredOffers();
    res.status(200).json({ message: "Expired offers processed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error processing expired offers.", error: error.message });
  }
};

// ✅ Create or Update Discount Settings
exports.updateDiscountSettings = async (req, res) => {
  try {
    const { newUserDiscountType, newUserDiscountValue, expirationDate } = req.body;

    // Validate type
    if (!['percentage', 'fixed'].includes(newUserDiscountType)) {
      return res.status(400).json({
        message: 'Invalid discount type. Must be "percentage" or "fixed".'
      });
    }

    // Validate value
    if (newUserDiscountValue <= 0) {
      return res.status(400).json({
        message: 'Discount value must be greater than 0.'
      });
    }

    // Validate expirationDate (if provided)
    let expiry = null;
    if (expirationDate) {
      const parsedDate = new Date(expirationDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid expiration date format.' });
      }
      expiry = parsedDate;
    }

    const settings = await DiscountSettings.findOneAndUpdate(
      {}, // only one settings document
      {
        newUserDiscountType,
        newUserDiscountValue,
        expirationDate: expiry
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Discount settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Error updating discount settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// ✅ Get Current Discount Settings
exports.getDiscountSettings = async (req, res) => {
  try {
    const settings = await DiscountSettings.findOne();

    // Check if discount expired
    let isExpired = false;
    if (settings?.expirationDate && settings.expirationDate <= new Date()) {
      isExpired = true;
    }

    res.status(200).json({
      success: true,
      settings: settings || {},
      isExpired,
    });
  } catch (error) {
    console.error('Error fetching discount settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

