const vendorOrder = require('../../../Models/Vendor/VendorOrderModel')
const UserOrder = require('../../../Models/User/OrderModel');


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

        const orders = await vendorOrder.find(filter);

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
        
        // Check if the status is valid
        const validStatuses = ["Pending", "Processing", "In-Transit", "Delivered", "Cancelled", "Returned"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        // Update VendorOrder
        const updatedVendorOrder = await VendorOrder.findOneAndUpdate(
            { _id: orderId },  // Find Vendor order by ID
            { status },         // Update status
            { new: true }       // Return the updated order
        );

        if (!updatedVendorOrder) {
            return res.status(404).json({ success: false, message: "Vendor order not found" });
        }

        // Update UserOrder
        const updatedUserOrder = await UserOrder.findOneAndUpdate(
            { _id: orderId },  // Find User order by ID
            { status },         // Update status
            { new: true }       // Return the updated order
        );

        if (!updatedUserOrder) {
            console.warn("Warning: User order not found for Vendor order", orderId);
        }

        console.log("Updated Vendor Order:", updatedVendorOrder);
        console.log("Updated User Order:", updatedUserOrder);

        return res.status(200).json({ success: true, message: "Order status updated", order: updatedVendorOrder });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};