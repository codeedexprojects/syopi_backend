const Wishlist = require("../../../Models/User/WishlistModel");

//add to wishlist
exports.addToWishList = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;
  try {
    const newWishlist = await Wishlist({ userId, productId });
    await newWishlist.save();
    res
      .status(200)
      .json({ message: "Product added to wishlist", wishlist: newWishlist });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate entry error
      return res.status(400).json({ message: "Product already in wishlist" });
    }
    res
      .status(500)
      .json({
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
    const totalWishlistItems = await Wishlist.countDocuments({ userId });
    const wishlist = await Wishlist.find({ userId }).populate("productId").skip(skip).limit(limit);
     // Pagination metadata
     const totalPages = Math.ceil(totalWishlistItems / limit);
     const hasNextPage = page < totalPages;
     const hasPrevPage = page > 1;
    res.status(200).json({ wishlist ,pagination: {
      totalWishlistItems,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPrevPage,
  }});
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching wishlist", error: error.message });
  }
};

//remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  try {
    const result = await Wishlist.findOneAndDelete({ userId, productId });
    if (!result) {
      return res.status(404).json({ message: "Product not in wishlist" });
    }

    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error removing product from wishlist",
        error: error.message,
      });
  }
};
