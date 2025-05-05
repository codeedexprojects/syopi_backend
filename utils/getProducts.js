// const Product = require('../Models/Admin/productModel');
// const Wishlist = require('../Models/User/WishlistModel');
// const Cart = require('../Models/User/cartModel'); // Add this line


// const getProduct = async (userId) => {
//     try {
//         let productWishlists = [];
//         let productCartItems = [];

//         if(userId){
//             const userWishlist = await Wishlist.find({ userId: userId });
//             productWishlists = userWishlist ? userWishlist.map((item) => item.productId.toString()) : [];

//              // Get Cart
//             const userCart = await Cart.findOne({ userId });
//             if (userCart && userCart.items.length > 0) {
//                 productCartItems = userCart.items.map(item => item.productId.toString());
//             }
//         }

//         const products = await Product.find().populate({ path: "offers", select: "offerType amount" });

      
//         const updatedProducts = products.map((product) => {
//             const variant = product.variants?.[0]; 
//             const price = variant?.price || null;
//             const offerPrice = variant?.offerPrice;
//             const hasValidOffer = offerPrice !== undefined && offerPrice !== null && offerPrice < price;

//             return {
//                 ...product.toObject(),
//                 isWishlisted: productWishlists.includes(product._id.toString()),
//                 isCarted: productCartItems.includes(product._id.toString()),
//                 defaultPrice: price,
//                 defaultOfferPrice: hasValidOffer ? offerPrice : null,
//             };
//         });

//         return updatedProducts;
//     } catch (err) {
//         console.error('Error fetching product listing:', err);
//         throw new Error('Error fetching products from the database');
//         // res.status(500).json({ message: 'Server error' });
//     }
// };

// module.exports = getProduct;

const Product = require('../Models/Admin/productModel');
const Wishlist = require('../Models/User/WishlistModel');
const Cart = require('../Models/User/cartModel');

const getProduct = async (userId) => {
    try {
        let productWishlists = [];
        let cartItemMap = new Map(); // To store cart items for quick lookup

        if (userId) {
            // Wishlist
            const userWishlist = await Wishlist.find({ userId });
            productWishlists = userWishlist.map((item) => item.productId.toString());

            // Cart
            const userCart = await Cart.findOne({ userId });
            if (userCart && userCart.items.length > 0) {
                userCart.items.forEach(item => {
                    const key = `${item.productId.toString()}_${item.color}_${item.size}`;
                    cartItemMap.set(key, true);
                });
            }
        }

        const products = await Product.find().populate({ path: "offers", select: "offerType amount" });

        const updatedProducts = products.map((product) => {
            const variants = product.variants?.map(variant => {
                const updatedSizes = variant.sizes.map(sizeObj => {
                    const key = `${product._id.toString()}_${variant.color}_${sizeObj.size}`;
                    const isCarted = cartItemMap.has(key);

                    return {
                        ...sizeObj.toObject(),
                        isCarted,
                    };
                });

                return {
                    ...variant.toObject(),
                    sizes: updatedSizes,
                };
            });

            // Price info from first variant
            const variant = product.variants?.[0];
            const price = variant?.price || null;
            const offerPrice = variant?.offerPrice;
            const hasValidOffer = offerPrice !== undefined && offerPrice !== null && offerPrice < price;

            return {
                ...product.toObject(),
                variants,
                isWishlisted: productWishlists.includes(product._id.toString()),
                defaultPrice: price,
                defaultOfferPrice: hasValidOffer ? offerPrice : null,
            };
        });

        return updatedProducts;
    } catch (err) {
        console.error('Error fetching product listing:', err);
        throw new Error('Error fetching products from the database');
    }
};

module.exports = getProduct;
