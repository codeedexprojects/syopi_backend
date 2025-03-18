const VendorOrder = require('../../../Models/Vendor/VendorOrderModel');
const UserOrder = require('../../../Models/User/OrderModel')

// Get all orders with optional status filtering
exports.getAllOrders = async (req, res) => {
    try {
        const { status } = req.query;

        // Build filter object
        let filter = {};
        if (status) {
            filter.status = status; // Filter by status if provided
        }

        const orders = await VendorOrder.find(filter);
        
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        
    const {status, orderId} = req.body;
        console.log(status, orderId);
        
        // Check if status is valid
        const validStatuses = ["Pending", "Processing", "In-Transit", "Delivered", "Cancelled", "Returned"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }
        const updatedOrder = await VendorOrder.findOneAndUpdate({_id:orderId}, { status }, { new: true });
        
        const userOrder = await UserOrder.findOneAndUpdate(
            { _id: orderId }, // Assuming there’s a reference to UserOrder in VendorOrder
            { status },
            { new: true }
        );

        if (!userOrder) {
            console.warn("Warning: User order not found for Vendor order", orderId);
        }

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        console.log(updatedOrder);
        return res.status(200).json({ success: true, message: "Order status updated", order: updatedOrder });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

