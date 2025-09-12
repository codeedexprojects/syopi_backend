const VendorOrder = require('../../../Models/Vendor/VendorOrderModel')
const UserOrder = require('../../../Models/User/OrderModel');
const User = require("../../../Models/User/UserModel");
const Product = require('../../../Models/Admin/productModel')



exports.getOrderByVendorId = async (req, res) => {
    try {
        const vendorId = req.user.id;  // Vendor ID comes from authenticated user

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

    const validStatuses = [
      'Pending', 'Confirmed', 'Processing', 'Shipping', 'In-Transit',
      'Delivered', 'Cancelled', 'Return_Requested', 'Return_Approved', 'Return_Processing', 'Returned'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    // ✅ Fetch VendorOrder first to check current status
    const vendorOrder = await VendorOrder.findById(orderId);
    if (!vendorOrder) {
      return res.status(404).json({ success: false, message: "Vendor order not found" });
    }

    // ✅ Validate state transitions
    if (status === "Return_Processing") {
      return res.status(400).json({ success: false, message: "Only admins can set this status" });
    }

    if (status === "Return_Approved" && vendorOrder.status !== "Return_Requested") {
      return res.status(400).json({ success: false, message: "Can only approve return if status is Return_Requested" });
    }

    // ✅ Vendors should not set Return_Processing or Returned directly
    if ( status === "Returned" && vendorOrder.status !== "Return_Processing") { 
      return res.status(403).json({ success: false, message: "Can only set to returned if status is Return_Approved" });
    }

    const updateFields = { status };
    if (status === "Delivered") {
      updateFields.deliveredAt = new Date();
    }

    // ✅ Update VendorOrder
    const updatedVendorOrder = await VendorOrder.findByIdAndUpdate(orderId, updateFields, { new: true });
    if (!updatedVendorOrder) {
      return res.status(404).json({ success: false, message: "Vendor order not found after update" });
    }

    // ✅ Update corresponding UserOrder
    const userOrder = await UserOrder.findByIdAndUpdate(
      updatedVendorOrder.orderId,
      updateFields,
      { new: true }
    );
    if (!userOrder) {
      return res.status(404).json({ success: false, message: "User order not found" });
    }

    // ✅ Fetch the user
    const user = await User.findById(updatedVendorOrder.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Coins logic for Delivered
    if (status === "Delivered" && !updatedVendorOrder.coinsAwarded && userOrder.coinsEarned > 0) {
      await user.creditCoins(
        userOrder.coinsEarned,
        userOrder._id,
        'Order',
        'Coins awarded for delivered order'
      );
      updatedVendorOrder.coinsAwarded = true;
      await updatedVendorOrder.save();
    }

    // ✅ Coins reversal logic for Cancelled or Returned
    if (
      (status === "Cancelled" || status === "Returned") &&
      updatedVendorOrder.coinsAwarded &&
      !updatedVendorOrder.coinsReversed &&
      userOrder.coinsEarned > 0
    ) {
      await user.spendCoins(
        userOrder.coinsEarned,
        userOrder._id,
        'Order',
        'Coins reversed due to cancellation or return'
      );
      updatedVendorOrder.coinsReversed = true;
      await updatedVendorOrder.save();
    }

    // ✅ Update stock and sales on cancellation or return
    if (status === "Cancelled" || status === "Returned") {
      for (const item of userOrder.products) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        product.totalStock += item.quantity;
        product.totalSales -= item.quantity;

        const variant = product.variants.find(v =>
          v.color === item.color && v.price === item.price
        );

        if (variant) {
          variant.salesCount -= item.quantity;
          const sizeObj = variant.sizes.find(s => s.size === item.size);
          if (sizeObj) {
            sizeObj.stock += item.quantity;
            sizeObj.salesCount -= item.quantity;
          }
        }

        await product.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order: updatedVendorOrder
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.vendorApproveReturn = async (req, res) => {
  try {
    const { orderId } = req.body;

    // ✅ Fetch the vendor order
    const vendorOrder = await VendorOrder.findById(orderId);
    if (!vendorOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ✅ Ensure current status is Return_Requested
    if (vendorOrder.status !== "Return_Requested") {
      return res.status(400).json({ success: false, message: "Return not in requested state" });
    }

    // ✅ Update vendor order status
    vendorOrder.status = "Return_Approved";
    await vendorOrder.save();

    // ✅ Also update corresponding UserOrder status
    const userOrder = await UserOrder.findById(vendorOrder.orderId);
    if (!userOrder) {
      return res.status(404).json({ success: false, message: "Corresponding user order not found" });
    }

    userOrder.status = "Return_Approved";
    await userOrder.save();

    return res.status(200).json({
      success: true,
      message: "Return approved by vendor and user order updated",
      vendorOrder,
      userOrder
    });

  } catch (error) {
    console.error("Error approving return by vendor:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

