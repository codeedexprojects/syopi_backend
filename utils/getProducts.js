const Product = require('../Models/Admin/productModel');
const Wishlist = require('../Models/User/WishlistModel');

const getProduct = async (userId) => {
    try {
        let productWishlists = [];
        if(userId){
            const userWishlist = await Wishlist.find({ userId: userId });
            productWishlists = userWishlist ? userWishlist.map((item) => item.productId.toString()) : [];
        }

        // Fetch products
        const products = await Product.find().populate({ path: "offers", select: "offerType amount" });

        // Add `isWishlisted` flag if wishlist data is available
        const updatedProducts = products.map((product) => ({
            ...product.toObject(),
            isWishlisted: productWishlists.includes(product._id.toString()), // Check against wishlist
        }));

        return updatedProducts;
    } catch (err) {
        console.error('Error fetching product listing:', err);
        throw new Error('Error fetching products from the database');
        // res.status(500).json({ message: 'Server error' });
    }
};

module.exports = getProduct;