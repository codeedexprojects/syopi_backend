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
const VendorPayout = require('../../../Models/Admin/vendorPayout')

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

const getAdminRevenueStats = async (req, res) => {
  try {
    const { type } = req.query;
    const matchStage = { status: "Delivered" }; // ✅ only delivered

    // ✅ Date filter
    const now = new Date();
    if (type === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      matchStage.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (type === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
    }
    
    const revenueData = await Order.aggregate([
      { $match: matchStage },

      // 🔁 Join with Product collection
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },

      // ✅ Filter admin-owned products only (adjust as per your admin identification)
      {
        $match: {
          "productDetails.ownerType": 'admin' // or: mongoose.Types.ObjectId('ADMIN_USER_ID')
        }
      },

      // 🧮 Compute cost = cost * quantity
      {
        $addFields: {
          cost: { $multiply: ["$productDetails.cost", "$quantity"] }
        }
      },

      // 📊 Group stats
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$itemTotal" },
          totalCost: { $sum: "$cost" }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalRevenue: 1,
          totalCost: 1,
          netRevenue: { $subtract: ["$totalRevenue", "$totalCost"] }
        }
      }
    ]);

    const result = revenueData[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalCost: 0,
      netRevenue: 0
    };

    return res.status(200).json({
      message: `Admin revenue stats ${type ? `for ${type}` : ""}`,
      ...result
    });
  } catch (error) {
    console.error("Admin Revenue Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



const getAdminCommissionRevenue = async (req, res) => {
  try {
    const { type } = req.query;
    const matchStage = {}; // dynamic date filtering

    // 📅 Date filter
    const now = new Date();
    if (type === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      matchStage.payoutDate = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (type === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      matchStage.payoutDate = { $gte: startOfWeek, $lte: endOfWeek };
    }

    const result = await VendorPayout.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: 1 },
          totalAdminCommission: { $sum: "$adminCommission" },
          totalSales: { $sum: "$totalSales" }
        }
      },
      {
        $project: {
          _id: 0,
          totalPayouts: 1,
          totalSales: 1,
          totalAdminCommission: 1
        }
      }
    ]);

    const stats = result[0] || {
      totalPayouts: 0,
      totalSales: 0,
      totalAdminCommission: 0
    };

    return res.status(200).json({
      message: `Admin commission stats ${type ? `for ${type}` : "for all time"}`,
      ...stats
    });
  } catch (error) {
    console.error("Commission Stats Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};




module.exports = {
  getProductStats,
  getOrderStats,
  getUserStats,
  getAdminRevenueStats,
  getAdminCommissionRevenue
};
