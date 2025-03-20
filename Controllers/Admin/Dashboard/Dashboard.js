const Product = require('../../../Models/Admin/productModel');
const Order = require('../../../Models/Vendor/VendorOrderModel');
const User = require('../../../Models/User/UserModel');

const getAdminDashboard = async (req, res) => {
  try {
    //  Get Product Data
    const totalProducts = await Product.countDocuments();
    const outOfStock = await Product.countDocuments({ stock: { $lte: 0 } });
    const limitedStock = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 } });

    //  Get Orders Data
    const totalOrders = await Order.countDocuments();
    const currentOrders = await Order.countDocuments({ status: { $in: ['Pending', 'Processing', 'In-Transit'] } });
    
    // Count Orders by Status
    const orderStatusCount = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    //  Get All Product Details
    const allProducts = await Product.find().lean();

    // Get All Users
    const totalUsers = await User.countDocuments();
    const allUsers = await User.find().select('-password').lean(); 

    return res.status(200).json({
      totalProducts,
      outOfStock,
      limitedStock,
      totalOrders,
      currentOrders,
      orderStatusCount,
      allProducts,
      totalUsers,
      allUsers
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getAdminDashboard };
