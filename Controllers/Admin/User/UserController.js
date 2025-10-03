const User = require('../../../Models/User/UserModel');
const Product = require('../../../Models/Admin/productModel');
const Order = require('../../../Models/Vendor/VendorOrderModel');
const Wishlist = require('../../../Models/User/WishlistModel');
const Cart =  require('../../../Models/User/cartModel')
const Review = require('../../../Models/User/ReviewModel')
const CoinHistory = require('../../../Models/User/coinHistoryModel')


// get all users
exports.getAllUsers = async (req, res) => {
  try {
    const {
      sort = "newest",
      page = 1,
      limit = 10,
      startDate,
      endDate
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    let filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const users = await User.find(filter)
      .select("-password")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalUsers = await User.countDocuments(filter);
    const activeUsers = await User.countDocuments({ ...filter, isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayRegisteredUsers = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

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
      { $project: { _id: 0, count: 1, product: 1 } }
    ]);

    const topOrderedProduct = await Product.findOne({ totalSales: { $gt: 0 } })
      .sort({ totalSales: -1 });

    res.status(200).json({
      users,
      pagination: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        todayRegisteredUsers,
        totalPages: Math.ceil(totalUsers / limitNum),
        currentPage: pageNum,
        hasNextPage: pageNum * limitNum < totalUsers,
        hasPrevPage: pageNum > 1
      },
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

        const referredUsers = await User.find({ referredBy: user.referralCode }).select("-password");

        const coinTransactions = await CoinHistory.find({userId})

        // Response
        res.status(200).json({
            user,
            wishlist,
            cart,
            orders,
            totalOrders,
            activity,
            referredUsers,
            coinTransactions
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
