const mongoose = require("mongoose");
const Product = require('../../../Models/Admin/productModel');
const Order = require('../../../Models/Vendor/VendorOrderModel');

exports.getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.id; // Assuming vendor is authenticated
    console.log(vendorId)

    //  Get Product Data (Vendor-specific)
    const totalProducts = await Product.countDocuments({ owner: vendorId });
    const currentOrders = await Order.countDocuments({vendorId, status: { $in: ['Pending', 'Processing', 'In-Transit'] } });
    const outOfStock = await Product.countDocuments({ owner: vendorId , totalStock: { $lte: 0 } });
    const limitedStock = await Product.countDocuments({ owner: vendorId , totalStock: { $lte: 10, $gt: 0 } });

    const orders = await Order.find({ vendorId });
    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    
    const orderStatusCount = await Order.aggregate([
        { $match: { vendorId: vendorObjectId } },  // Ensure vendorId is a valid ObjectId
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    return res.status(200).json({
        totalProducts,
        outOfStock,
        currentOrders,
        limitedStock,
        totalOrders: orders.length,
        orderStatusCount,
        orders
    });
    
  } catch (error) {
    console.error('Error fetching vendor dashboard:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
}
};

