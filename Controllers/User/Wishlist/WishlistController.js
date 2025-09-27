const Wishlist = require("../../../Models/User/WishlistModel");
const Cart = require('../../../Models/User/cartModel')

//add to wishlist
exports.addToWishList = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;
  try {
    const newWishlist = await Wishlist({ userId, productId });
    await newWishlist.save();
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Product added to wishlist",
      wishlist: newWishlist,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Product already in wishlist",
      });
    }
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Error adding product to wishlist",
      error: error.message,
    });
  }
};

// get all user wishlist
exports.getUserWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // ✅ Get total wishlist items for pagination (before cleaning)
    const totalWishlistItems = await Wishlist.countDocuments({ userId });

    // ✅ Retrieve wishlist with product details
    let wishlistItems = await Wishlist.find({ userId })
      .populate("productId")
      .skip(skip)
      .limit(limit);

    // ✅ Remove wishlist items with deleted products
    wishlistItems = wishlistItems.filter(item => item.productId && item.productId !== null);

    // ✅ Retrieve user's cart items
    const cart = await Cart.findOne({ userId });
    const cartProductIds = new Set();
    if (cart && cart.items.length > 0) {
      for (const item of cart.items) {
        if (item.productId) {
          cartProductIds.add(item.productId.toString());
        }
      }
    }

    // ✅ Map wishlist items to include inCart flag
    const wishlist = wishlistItems.map(item => ({
      _id: item._id,
      productId: item.productId,
      inCart: cartProductIds.has(item.productId._id.toString())
    }));

    // ✅ Pagination metadata (recalculate after filtering)
    const totalPages = Math.ceil(totalWishlistItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // ✅ Send response
    res.status(200).json({
      wishlist,
      pagination: {
        totalWishlistItems,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({
      message: "Error fetching wishlist",
      error: error.message
    });
  }
};


//remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  try {
    const result = await Wishlist.findOneAndDelete({ userId, productId });
    if (!result) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Product not in wishlist",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 500,
      message: "Error removing product from wishlist",
      error: error.message,
    });
  }
};
