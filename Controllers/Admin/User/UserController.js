const User = require('../../../Models/User/UserModel');
const Product = require('../../../Models/Admin/productModel');
const Order = require('../../../Models/Vendor/VendorOrderModel');
const Wishlist = require('../../../Models/User/WishlistModel');
const Cart =  require('../../../Models/User/cartModel')
const Review = require('../../../Models/User/ReviewModel')


// get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        if (!users) {
            return res.status(404).json({ message: "Users not found" });
        }

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = totalUsers - activeUsers;

        // Most wishlisted product with count
        const mostWishlistedProduct = await Wishlist.aggregate([
            { $group: { _id: "$productId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    product: 1
                }
            }
        ]);

        // Top ordered product with count
            const topOrderedProduct = await Product.findOne({ totalSales: { $gt: 0 } })
            .sort({ totalSales: -1 })


            res.status(200).json({
                users,
                totalUsers,
                activeUsers,
                inactiveUsers,
                mostWishlistedProduct: mostWishlistedProduct[0]
                    ? {
                        product: mostWishlistedProduct[0].product,
                        count: mostWishlistedProduct[0].count
                    }
                    : null,
                topOrderedProduct: topOrderedProduct
                    ? {
                        product: topOrderedProduct,
                        count: topOrderedProduct.totalSales
                    }
                    : null
            });
            

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


exports.getUserById = async (req, res) => {
    const userId = req.params.id;
   

    

    try {
        // Get User
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get Wishlist 
        const wishlist = await Wishlist.find({ userId }).populate('productId');

        // Get Cart 
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        // Get Orders 
        const orders = await Order.find({ userId }).populate('productId');

        // Total order
        const totalOrders = await Order.countDocuments({ userId });

        //Get Activity
        
        const activity = await Review.find({userId})

        // Response
        res.status(200).json({
            user,
            wishlist,
            cart,
            orders,
            totalOrders,
            activity
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data', error: error.message });
    }
};


//search users
exports.searchUsers = async(req,res) => {
    const { name,phone } = req.query;
    try {
        const query = {};
        if(name){
            query.name = { $regex: name, $options: "i" }
        };
        if(phone){
            query.phone = { $regex: phone, $options: "i" }
        };
        const users = await User.find(query).select("-password");
        if(users.length === 0){
            return res.status(404).json("No users found")
        }
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ message: "Error searching users", error:error.message })
    }
}