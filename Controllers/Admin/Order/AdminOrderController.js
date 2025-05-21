const VendorOrder = require('../../../Models/Vendor/VendorOrderModel');
const UserOrder = require('../../../Models/User/OrderModel')

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
            });

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

        // Check if the status is valid
        const validStatuses = ["Pending", "Processing", 'Shipping', "In-Transit", "Delivered", "Cancelled", "Returned"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        // If status is Delivered, set deliveredAt to current date
        const updateFields = { status };
        if (status === "Delivered") {
            updateFields.deliveredAt = new Date();
        }

        // Update VendorOrder
        const updatedVendorOrder = await VendorOrder.findOneAndUpdate(
            { _id: orderId },  
            updateFields,         
            { new: true }       
        );

        if (!updatedVendorOrder) {
            return res.status(404).json({ success: false, message: "Vendor order not found" });
        }

        // Update UserOrder (if applicable)
        const updatedUserOrder = await UserOrder.findOneAndUpdate(
            { _id: orderId },  
            updateFields,         
            { new: true }       
        );

        if (!updatedUserOrder) {
            console.warn("Warning: User order not found for Vendor order", orderId);
        }

        console.log("Updated Vendor Order:", updatedVendorOrder);

        return res.status(200).json({ success: true, message: "Order status updated", order: updatedVendorOrder });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


