const Review = require("../../../Models/User/ReviewModel");
const Order = require("../../../Models/Vendor/VendorOrderModel");
const Product = require("../../../Models/Admin/productModel");

// Add Review
exports.addReview = async (req, res) => {
  const {  productId, rating, message } = req.body;
  // const image = req.files
  const userId=req.user.id

  try {
    const order = await Order.findOne({
      userId,
      productId: productId,
      status: "Delivered", 
    });
    


    if (!order) {
      return res.status(403).json({
        message: "You can only review products you have purchased and received.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user has already reviewed this product
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product." });
    }

    const review = new Review({
      userId,
      productId,
      rating,
      message,
      // image,
    });

    await review.save();
  
      // Recalculate product's average rating
      const reviews = await Review.find({ productId });
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

      // Update product with the new average rating
      product.averageRating = averageRating.toFixed(1);
      product.reviewCount = totalReviews
      await product.save();

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Reviews for a Product
exports.getReviewsByProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const reviews = await Review.find({ productId }).populate("userId", "name").sort({createdAt:-1})
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.hasReviewedLatestDelivered = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find the latest delivered order for this user
    const latestDeliveredOrder = await Order.findOne({
      userId,
      status: "Delivered",
    }).sort({ createdAt: -1 });

    if (!latestDeliveredOrder) {
      return res.status(404).json({
        message: "You have no delivered orders yet.",
        product: null,
        hasReviewed: false,
      });
    }

    // Get product details
    const product = await Product.findById(latestDeliveredOrder.productId, "name images");
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        product: null,
        hasReviewed: false,
      });
    }

    // Check if review exists
    const existingReview = await Review.findOne({
      userId,
      productId: latestDeliveredOrder.productId,
    });

    res.status(200).json({
      product: {
        name: product.name,
        image: product.images?.[0] || null,
      },
      hasReviewed: !!existingReview,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
