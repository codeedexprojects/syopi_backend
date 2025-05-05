// const Product = require('../../../Models/Admin/productModel');
// const Order = require('../../../Models/Vendor/VendorOrderModel');
// const User = require('../../../Models/User/UserModel');

// exports.getAdminDashboard = async (req, res) => {
//   try {
//     //  Get Product Data
//     const totalProducts = await Product.countDocuments();
//     const outOfStock = await Product.countDocuments({ totalStock: { $lte: 0 } });
//     const limitedStock = await Product.countDocuments({ totalStock: { $lte: 10, $gt: 0 } });

//     //  Get Orders Data
//     const totalOrders = await Order.countDocuments();
//     const currentOrders = await Order.countDocuments({ status: { $in: ['Pending', 'Processing', 'In-Transit'] } });
    
//     // Count Orders by Status
//     const orderStatusCount = await Order.aggregate([
//       { $group: { _id: "$status", count: { $sum: 1 } } }
//     ]);

//     //  Get All Product Details
//     const allProducts = await Product.find().lean();

//     // Get All Users
//     const totalUsers = await User.countDocuments();
//     const allUsers = await User.find().select('-password').lean(); 

//     return res.status(200).json({
//       totalProducts,
//       outOfStock,
//       limitedStock,
//       totalOrders,
//       currentOrders,
//       orderStatusCount,
//       allProducts,
//       totalUsers,
//       allUsers
//     });
//   } catch (error) {
//     console.error('Error fetching admin dashboard:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// };


const Product = require('../../../Models/Admin/productModel');
const Order = require('../../../Models/Vendor/VendorOrderModel');
const User = require('../../../Models/User/UserModel');

// 🔸 Product Stats with filters
const getProductStats = async (req, res) => {
  try {
    const { name, category, minStock = 0, maxStock = Infinity } = req.query;

    const filter = {
      totalStock: { $gte: Number(minStock), $lte: Number(maxStock) }
    };

    if (name) filter.name = { $regex: name, $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };

    const totalProducts = await Product.countDocuments();
    const outOfStock = await Product.countDocuments({ totalStock: { $lte: 0 } });
    const limitedStock = await Product.countDocuments({ totalStock: { $lte: 10, $gt: 0 } });

    const filteredProducts = await Product.find(filter).lean();

    res.status(200).json({
      totalProducts,
      outOfStock,
      limitedStock,
      filteredCount: filteredProducts.length,
      products: filteredProducts
    });
  } catch (err) {
    console.error("Error fetching product stats:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔸 Order Stats with filters
const getOrderStats = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalOrders = await Order.countDocuments();
    const currentOrders = await Order.countDocuments({ status: { $in: ['Pending', 'Processing', 'In-Transit'] } });

    const orderStatusCount = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const filteredOrders = await Order.find(filter).lean();

    res.status(200).json({
      totalOrders,
      currentOrders,
      orderStatusCount,
      filteredCount: filteredOrders.length,
      orders: filteredOrders
    });
  } catch (err) {
    console.error("Error fetching order stats:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔸 User Stats with filters
const getUserStats = async (req, res) => {
  try {
    const { email, name, isBlocked } = req.query;
    const filter = {};

    if (email) filter.email = { $regex: email, $options: 'i' };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

    const totalUsers = await User.countDocuments();
    const filteredUsers = await User.find(filter).select('-password').lean();

    res.status(200).json({
      totalUsers,
      filteredCount: filteredUsers.length,
      users: filteredUsers
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getProductStats,
  getOrderStats,
  getUserStats
};
