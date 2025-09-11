// const mongoose = require("mongoose");
// const Product = require('../../../Models/Admin/productModel');
// const Order = require('../../../Models/Vendor/VendorOrderModel');

// exports.getVendorDashboard = async (req, res) => {
//   try {
//     const vendorId = req.user.id; // Assuming vendor is authenticated
//     console.log(vendorId)

//     //  Get Product Data (Vendor-specific)
//     const totalProducts = await Product.countDocuments({ owner: vendorId });
//     const currentOrders = await Order.countDocuments({vendorId, status: { $in: ['Pending', 'Processing', 'In-Transit'] } });
//     const outOfStock = await Product.countDocuments({ owner: vendorId , totalStock: { $lte: 0 } });
//     const limitedStock = await Product.countDocuments({ owner: vendorId , totalStock: { $lte: 10, $gt: 0 } });

//     const orders = await Order.find({ vendorId });
//     const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    
//     const orderStatusCount = await Order.aggregate([
//         { $match: { vendorId: vendorObjectId } },  // Ensure vendorId is a valid ObjectId
//         { $group: { _id: "$status", count: { $sum: 1 } } }
//     ]);
    
//     return res.status(200).json({
//         totalProducts,
//         outOfStock,
//         currentOrders,
//         limitedStock,
//         totalOrders: orders.length,
//         orderStatusCount,
//         orders
//     });
    
//   } catch (error) {
//     console.error('Error fetching vendor dashboard:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
// }
// };

const mongoose = require("mongoose");
const Product = require('../../../Models/Admin/productModel');
const Order = require('../../../Models/Vendor/VendorOrderModel');

// 🔸 Get Vendor Product Stats with optional filters
const getVendorProductStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { name, minStock = 0, maxStock = Infinity } = req.query;

    const filter = {
      owner: vendorId,
      totalStock: { $gte: Number(minStock), $lte: Number(maxStock) }
    };

    if (name) filter.name = { $regex: name, $options: 'i' };

    const totalProducts = await Product.countDocuments({ owner: vendorId });
    const outOfStock = await Product.countDocuments({ owner: vendorId, totalStock: { $lte: 0 } });
    const limitedStock = await Product.countDocuments({ owner: vendorId, totalStock: { $lte: 10, $gt: 0 } });

    const products = await Product.find(filter).lean();

    res.status(200).json({
      totalProducts,
      outOfStock,
      limitedStock,
      filteredCount: products.length,
      products
    });
  } catch (err) {
    console.error("Vendor Product Stats Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔸 Get Vendor Order Stats with optional filters
const getVendorOrderStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    const { status, startDate, endDate } = req.query;

    const filter = { vendorId: vendorObjectId };

    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalOrders = await Order.countDocuments({ vendorId });
    const currentOrders = await Order.countDocuments({
      vendorId,
      status: { $nin: ['Pending', 'Cancelled', 'Return_Requested', 'Return_Processing', 'Returned'] }
    });

    const orderStatusCount = await Order.aggregate([
      { $match: { vendorId: vendorObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const orders = await Order.find(filter).lean();

    res.status(200).json({
      totalOrders,
      currentOrders,
      orderStatusCount,
      filteredCount: orders.length,
      orders
    });
  } catch (err) {
    console.error("Vendor Order Stats Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getVendorProductStats,
  getVendorOrderStats
};
