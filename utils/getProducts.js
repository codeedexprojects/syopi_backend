const Product = require('../Models/Admin/productModel');
const Wishlist = require('../Models/User/WishlistModel');
const Cart = require('../Models/User/cartModel'); // Add this line


const getProduct = async (userId) => {
    try {
        let productWishlists = [];
        let productCartItems = [];

        if(userId){
            const userWishlist = await Wishlist.find({ userId: userId });
            productWishlists = userWishlist ? userWishlist.map((item) => item.productId.toString()) : [];

             // Get Cart
            const userCart = await Cart.findOne({ userId });
            if (userCart && userCart.items.length > 0) {
                productCartItems = userCart.items.map(item => item.productId.toString());
            }
        }

        
// console.log(productWishlists)
        // Fetch products
        const products = await Product.find().populate({ path: "offers", select: "offerType amount" });

        // Add `isWishlisted` flag if wishlist data is available
        const updatedProducts = products.map((product) => ({
            ...product.toObject(),
            isWishlisted: productWishlists.includes(product._id.toString()), // Check against wishlist
            isCarted: productCartItems.includes(product._id.toString())
        }));

        return updatedProducts;
    } catch (err) {
        console.error('Error fetching product listing:', err);
        throw new Error('Error fetching products from the database');
        // res.status(500).json({ message: 'Server error' });
    }
};

module.exports = getProduct;