const VendorOrder = require('../../../Models/Vendor/VendorOrderModel');
const UserOrder = require('../../../Models/User/OrderModel')
const User = require('../../../Models/User/UserModel')

// Get all orders with optional status filtering and product details
exports.getAllOrders = async (req, res) => {
    try {
        const { status } = req.query;

        // Build filter object
        let filter = {};
        if (status) {
            filter.status = status;
        }

        const orders = await VendorOrder.find(filter)
            .populate({
                path: 'productId',
                select: 'name images' 
            })
            .populate({
                path: 'vendorId',
                select: 'name email' 
            })
    

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, orderId } = req.body;
    console.log("Updating order status:", status, "Order ID:", orderId);

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipping', 'In-Transit', 'Delivered', 'Cancelled', 
        'Return_Requested', 'Return_Processing', 'Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const updateFields = { status };
    if (status === "Delivered") {
      updateFields.deliveredAt = new Date();
    }

    // ✅ Update VendorOrder
    const vendorOrder = await VendorOrder.findOneAndUpdate(
      { _id: orderId },
      updateFields,
      { new: true }
    );

    if (!vendorOrder) {
      return res.status(404).json({ success: false, message: "Vendor order not found" });
    }

    // ✅ Update corresponding main Order model (only top-level status)
    await UserOrder.findByIdAndUpdate(
      vendorOrder.orderId,
      updateFields,
      { new: true }
    );

    // ✅ Coins: Award on "Confirmed"
    if (status === "Confirmed" && !vendorOrder.coinsAwarded && vendorOrder.coinsEarned > 0) {
      await User.findByIdAndUpdate(vendorOrder.userId, {
        $inc: { coins: vendorOrder.coinsEarned }
      });
      vendorOrder.coinsAwarded = true;
      await vendorOrder.save();
    }

    // ✅ Coins: Reversal on "Cancelled" or "Returned"
    if (
      (status === "Cancelled" || status === "Returned") &&
      vendorOrder.coinsAwarded &&
      !vendorOrder.coinsReversed
    ) {
      await User.findByIdAndUpdate(vendorOrder.userId, {
        $inc: { coins: -vendorOrder.coinsEarned }
      });
      vendorOrder.coinsReversed = true;
      await vendorOrder.save();
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order: vendorOrder
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};




