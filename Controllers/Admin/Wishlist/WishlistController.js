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
