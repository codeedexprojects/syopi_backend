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
const UserOrder = require('../../../Models/User/OrderModel')

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
    const totalOrders = await UserOrder.countDocuments()

    const filteredProducts = await Product.find(filter).lean();

    res.status(200).json({
      totalProducts,
      outOfStock,
      limitedStock,
      totalOrders,
      filteredCount: filteredProducts.length,
      products: filteredProducts
    });
  } catch (err) {
    console.error("Error fetching product stats:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔸 Order Stats with filters
// -------------------- Sales Graph --------------------
const getOrderStats = async (req, res) => {
    try {
        const { range = "month" } = req.query;
        const now = new Date();
        let startDate;

        switch (range) {
            case "today":
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case "week":
                startDate = new Date();
                startDate.setDate(now.getDate() - 7);
                break;
            case "month":
                startDate = new Date();
                startDate.setMonth(now.getMonth() - 1);
                break;
            case "year":
                startDate = new Date();
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid range. Use today, week, month, or year."
                });
        }

        // Possible statuses to include
        const possibleStatuses = [
            "Pending", "Confirmed", "Processing", "Shipping",
            "In-Transit", "Delivered", "Cancelled",
            "Return_Requested", "Return_Processing", "Returned"
        ];

        const matchFilter = {
            createdAt: { $gte: startDate }
        };

        let groupId = {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
        };
        if (range === "today" || range === "week" || range === "month") {
            groupId.day = { $dayOfMonth: "$createdAt" };
        }

        const salesData = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        ...groupId,
                        status: "$status"
                    },
                    totalSales: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "Delivered"] }, "$itemTotal", 0]
                        }
                    },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year",
                        month: "$_id.month",
                        day: "$_id.day"
                    },
                    totalSales: { $sum: "$totalSales" },
                    statuses: {
                        $push: {
                            status: "$_id.status",
                            count: "$orderCount"
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                    "_id.day": 1
                }
            }
        ]);

        const formattedData = salesData.map(item => {
            let label;
            if (range === "year") {
                label = `${item._id.month}/${item._id.year}`;
            } else {
                label = `${item._id.day}/${item._id.month}`;
            }

            // Ensure every possible status is included
            const statusMap = {};
            item.statuses.forEach(s => {
                statusMap[s.status] = s.count;
            });

            const completeStatuses = possibleStatuses.map(status => ({
                status,
                count: statusMap[status] || 0
            }));

            return {
                label,
                totalSales: item.totalSales,
                statuses: completeStatuses
            };
        });

        res.status(200).json({
            success: true,
            range,
            data: formattedData
        });

    } catch (error) {
        console.error("Order Stats Error:", error.message);
        res.status(500).json({
            success: false,
            message: "Error fetching order stats",
            error: error.message
        });
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
    const { type, startDate, endDate } = req.query;
    const now = new Date();

    // Base match: only Delivered orders
    const matchStage = { status: "Delivered" };

    // === Date filters ===
    if (type === "daily") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      matchStage.createdAt = { $gte: start, $lte: end };
    } 
    else if (type === "weekly") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    } 
    else if (type === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    } 
    else if (type === "yearly") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    }

    // Custom date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    }
    
    // === Aggregation ===
    const revenueData = await Order.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $addFields: {
          cost: { $multiply: ["$productDetails.cost", "$quantity"] }
        }
      },
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

    // Default response if no data
    const result = revenueData[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalCost: 0,
      netRevenue: 0
    };

    res.status(200).json({
      message: `Admin revenue stats ${
        type ? `for ${type}` : (startDate && endDate ? `from ${startDate} to ${endDate}` : "for all time")
      }`,
      ...result
    });

  } catch (error) {
    console.error("Admin Revenue Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAdminCommissionRevenue = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const matchStage = {}; // Dynamic filter

    const now = new Date();

    // 📅 Predefined date filters
    if (type === "daily") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      matchStage.payoutDate = { $gte: start, $lte: end };
    } 
    else if (type === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      matchStage.payoutDate = { $gte: startOfWeek, $lte: endOfWeek };
    } 
    else if (type === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      matchStage.payoutDate = { $gte: startOfMonth, $lte: endOfMonth };
    }
    else if (type === "yearly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0); // Jan 1
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31
      matchStage.payoutDate = { $gte: startOfYear, $lte: endOfYear };
    }

    // 📅 Custom date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.payoutDate = { $gte: start, $lte: end };
    }

    // 📊 Aggregation
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
      message: `Admin commission stats ${
        type
          ? `for ${type}`
          : startDate && endDate
          ? `from ${startDate} to ${endDate}`
          : "for all time"
      }`,
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
