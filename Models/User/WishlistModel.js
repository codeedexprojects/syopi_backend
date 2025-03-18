const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    }
},{timestamps:true});

wishlistSchema.index({ productId: 1 ,userId: 1 }, { unique: true }); // Prevent duplicate entries for the same user and product.

module.exports = mongoose.model("Wishlist",wishlistSchema);