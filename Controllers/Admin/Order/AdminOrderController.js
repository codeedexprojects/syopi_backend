const VendorOrder = require('../../../Models/Vendor/VendorOrderModel');
const UserOrder = require('../../../Models/User/OrderModel')
const User = require('../../../Models/User/UserModel')
const Product = require('../../../Models/Admin/productModel')

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


exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, orderId } = req.body;
    console.log("Updating order status:", status, "Order ID:", orderId);

    const validStatuses = [
      'Pending', 'Confirmed', 'Processing', 'Shipping', 'In-Transit',
      'Delivered', 'Cancelled', 'Return_Requested', 'Return_Processing', 'Returned'
    ];
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

    // ✅ Update corresponding UserOrder
    const userOrder = await UserOrder.findByIdAndUpdate(
      vendorOrder.orderId,
      updateFields,
      { new: true }
    );

    if (!userOrder) {
      return res.status(404).json({ success: false, message: "User order not found" });
    }
    console.log(vendorOrder.userId);
    
    // ✅ Fetch the user
    const user = await User.findById(vendorOrder.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Coins: Award on "Delivered" using coinsEarned from UserOrder
    if (status === "Delivered" && !vendorOrder.coinsAwarded && userOrder.coinsEarned > 0) {
      await user.creditCoins(
        userOrder.coinsEarned,
        userOrder._id,
        'Order',
        'Coins awarded for delivered order'
      );
      vendorOrder.coinsAwarded = true;
      await vendorOrder.save();
    }

    // ✅ Coins: Reversal on "Cancelled" or "Returned" using coinsEarned from UserOrder
    if (
      (status === "Cancelled" || status === "Returned") &&
      vendorOrder.coinsAwarded &&
      !vendorOrder.coinsReversed &&
      userOrder.coinsEarned > 0
    ) {
      await user.spendCoins(
        userOrder.coinsEarned,
        userOrder._id,
        'Order',
        'Coins reversed due to cancellation or return'
      );
      vendorOrder.coinsReversed = true;
      await vendorOrder.save();
    }

    // ✅ Update stock and sales on cancellation or return
    if (status === "Cancelled" || status === "Returned") {
      for (const item of userOrder.products) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        // Increase totalStock and decrease totalSales
        product.totalStock += item.quantity;
        product.totalSales -= item.quantity;

        // Find the correct variant by color and price
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
      order: vendorOrder
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getOrderByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Verify user existence
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find all orders for the given user
        const orders = await UserOrder.find({ userId })
            .populate({
                path: 'products.productId',
                select: 'name images category'
            })
            .populate({
                path: 'coupon',
                select: 'code type value'
            });

        if (!orders.length) {
            return res.status(404).json({ success: false, message: "No orders found for this user" });
        }

        return res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("Error fetching orders by userId:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};