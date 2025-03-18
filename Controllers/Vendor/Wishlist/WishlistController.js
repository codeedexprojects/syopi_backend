const mongoose = require('mongoose');
const Product = require('../../../Models/Admin/productModel');
const Wishlist = require('../../../Models/User/WishlistModel');

//Get All Wishlist Counts for login vendor
exports.getAllWishlistCounts = async (req, res) => {
  try {
    const wishlistCounts = await Product.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(req.user.id) } },
  
        {
          $lookup: {
            from: "wishlists",          
            localField: "_id",          
            foreignField: "productId",  
            as: "wishlistEntries"      
          },
        },
        {
          $project: {
            name: 1,
            productType: 1,
            images: 1,
            category: 1,
            description: 1,
            subcategory: 1,
            brand: 1,
            prices: 1,
            stock: 1,
            date: 1,
            details: 1,
            offer: 1,
            coupon: 1,
            owner: 1,
            ownerType: 1,
            status: 1,
            wishlistCount: { $size: "$wishlistEntries" }, 
            _id: 1,
          },
        },
        { $sort: { wishlistCount: -1 } }
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