const VendorOrder = require('../../../Models/Vendor/VendorOrderModel')
const UserOrder = require('../../../Models/User/OrderModel');
const User = require("../../../Models/User/UserModel");



exports.getOrderByVendorId = async (req, res) => {
    try {
        const vendorId = req.user.id;  // Vendor ID comes from authenticated user
        console.log("Fetching orders for vendor:", vendorId);

        const { status } = req.query;  // Filter by status if provided
        
        // Build filter object for querying
        let filter = { vendorId };

        if (status) {
            filter.status = status;  // Add status filter if provided
        }

        const orders = await VendorOrder.find(filter).populate({
                path: 'productId',
                select: 'name images' 
            })


        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};



exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, orderId } = req.body;
    console.log("Updating order status:", status, "Order ID:", orderId);

    const validStatuses = [
      "Pending", "Confirmed", "Processing", "Shipping",
      "In-Transit", "Delivered", "Cancelled", 
      "Return_Requested", "Return_Processing", "Returned"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const updateFields = { status };
    if (status === "Delivered") {
      updateFields.deliveredAt = new Date();
    }

    const vendorOrder = await VendorOrder.findById(orderId);
    if (!vendorOrder) {
      return res.status(404).json({ success: false, message: "Vendor order not found" });
    }

    // ✅ Update VendorOrder fields
    Object.assign(vendorOrder, updateFields);

    // ✅ Coin award on Confirmed
    if (
      status === "Confirmed" &&
      !vendorOrder.coinsAwarded &&
      vendorOrder.coinsEarned > 0
    ) {
      await User.findByIdAndUpdate(vendorOrder.userId, {
        $inc: { coins: vendorOrder.coinsEarned }
      });
      vendorOrder.coinsAwarded = true;
    }

    // ✅ Coin reversal on Cancelled/Returned
    if (
      ["Cancelled", "Returned"].includes(status) &&
      vendorOrder.coinsAwarded &&
      !vendorOrder.coinsReversed &&
      vendorOrder.coinsEarned > 0
    ) {
      await User.findByIdAndUpdate(vendorOrder.userId, {
        $inc: { coins: -vendorOrder.coinsEarned }
      });
      vendorOrder.coinsReversed = true;
    }

    await vendorOrder.save();

    // ✅ Update main Order status (top-level)
    if (vendorOrder.orderId) {
      await UserOrder.findByIdAndUpdate(
        vendorOrder.orderId,
        updateFields
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: vendorOrder,
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};