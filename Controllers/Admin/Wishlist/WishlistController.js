const Wishlist = require("../../../Models/User/WishlistModel");
const mongoose = require("mongoose");

//Get All Wishlist Counts for Admin
exports.getAllWishlistCounts = async (req, res) => {
  try {
    const wishlistCounts = await Wishlist.aggregate([
      { $group: { _id: "$productId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $sort: { count: -1 } },
      { $project: { productId: "$_id", count: 1, product: 1, _id: 0 } },
    ]);

    res.status(200).json({ wishlistCounts });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching wishlist counts",
        error: error.message,
      });
  }
};

//Get Wishlist Count for a Product
exports.getProductWishlistCount = async (req, res) => {
  const productId = req.params.id;

  try {
    const count = await Wishlist.countDocuments({ productId });
    if (!count) {
      return res.status(400).json({ message: "Invalid productId" });
    }
    res.status(200).json({ productId, wishlistCount: count });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching product wishlist count",
        error: error.message,
      });
  }
};

// Get total count of unique products in wishlist
exports.getWishlistProductCount = async (req, res) => {
  try {
    const result = await Wishlist.distinct("productId");
    res.status(200).json({
      totalProductsInWishlist: result.length,
      // productIds: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching wishlist product count",
      error: error.message,
    });
  }
};

// Get list of products in wishlist with their counts
exports.getWishlistProducts = async (req, res) => {
  try {
    const wishlistProducts = await Wishlist.aggregate([
      {
        $group: {
          _id: "$productId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          count: 1,
          product: { _id: 1, name: 1, price: 1, images: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({ wishlistProducts });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching wishlist products",
      error: error.message,
    });
  }
};

// Get users who wishlisted a specific product
exports.getUsersForWishlistProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const users = await Wishlist.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          userId: "$userDetails._id",
          name: "$userDetails.name",
          email: "$userDetails.email",
        },
      },
    ]);

    if (!users.length) {
      return res.status(404).json({ message: "No users found for this product" });
    }

    res.status(200).json({
      productId,
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users for wishlist product",
      error: error.message,
    });
  }
};
