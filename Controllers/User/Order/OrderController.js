const mongoose = require("mongoose");
const Order = require('../../../Models/User/OrderModel')
const Checkout = require('../../../Models/User/CheckoutModel');
const Product = require('../../../Models/Admin/productModel')
const Cart = require("../../../Models/User/cartModel");
const Address = require('../../../Models/User/AddressModel')
const VendorOrder = require('../../../Models/Vendor/VendorOrderModel')
const CoinSettings = require("../../../Models/Admin/CoinModel");
const User = require('../../../Models/User/UserModel')
const moment = require("moment");
const axios = require("axios");


// place order
exports.placeOrder = async (req, res) => {
    const { checkoutId, addressId, deliveryCharge, paymentMethod } = req.body;
    const userId = req.user.id;
    // Validate required fields
    if (!checkoutId || !addressId || !userId || !paymentMethod) {
        return res.status(400).json({ message: "Missing required fields: checkoutId, addressId, paymentMethod, or user authentication" });
    }

    try {

        // Check if checkout exists and is not already processed
        const checkout = await Checkout.findById(checkoutId)
            // .populate("items.productId")
        if (!checkout) {
            return res.status(404).json({ message: "Checkout not found" });
        }
        if (checkout.isProcessed) {
            return res.status(400).json({ message: "Checkout has already been processed" });
        }

        // Create new order
        const newOrder = new Order({
            userId,
            addressId,
            checkoutId,
            deliveryCharge,
            paymentMethod
        });

        // Save order properly
        await newOrder.save();

        // Organize items by vendor
        // const vendorOrders = {};
        for (const item of checkout.items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;
            
            // Find the correct variant by color
            const variant = product.variants.find(v => v.color === item.color);
            if (!variant) continue;

            // Find the correct size inside the variant
            const sizeData = variant.sizes.find(s => s.size === item.size);
            if (!sizeData) continue;

            // Ensure stock is available
            if (sizeData.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${product.name} (${item.color} - ${item.size})` });
            }

            // Reduce stock
            sizeData.stock -= item.quantity;

            
            // Increment sales count for the size
            sizeData.salesCount += item.quantity;

            // Increment sales count for the variant
            variant.salesCount += item.quantity;

            // Update total sales count at the product level
            product.totalSales += item.quantity;

            // Update total stock count
            product.totalStock = product.variants.reduce((sum, v) => 
                sum + v.sizes.reduce((sizeSum, s) => sizeSum + s.stock, 0), 0
            );

            // Save updated product
            await product.save();

                // Fetch the address using the addressId
            const address = await Address.findById(addressId);
            if (!address) {
                return res.status(404).json({ success: false, message: "Address not found" });
            }

            const deliveryDetails = await fetchDeliveryDetails(address.pincode)
            if (!deliveryDetails) {
                return res.status(400).json({
                    success: false,
                    message: "Failed to calculate delivery date",
                });
            }

            const vendorOrder = new VendorOrder({
                vendorId: product.owner.toString(),
                userId,
                orderId: newOrder._id, // Keep reference to the main order
                productId: product._id,  // ✅ Store product directly
                addressId:addressId,
                quantity: item.quantity,
                price: item.price,
                itemTotal: item.price * item.quantity,
                discountedPrice:item.DiscountedPrice,
                couponDiscountedValue:item.couponDiscountedValue,
                color: item.color,
                colorName:item.colorName,
                size: item.size, 
                deliveryDetails,
                status: "Confirmed",
            });
            
            await vendorOrder.save();
        }

        //     // Group products by vendor
        //     const vendorId = product.owner.toString();
        //     if (!vendorOrders[vendorId]) {
        //         vendorOrders[vendorId] = {
        //             vendorId,
        //             userId,
        //             orderId: newOrder._id,
        //             items: [],
        //             subtotal: 0,
        //         };
        //     }
        //     vendorOrders[vendorId].items.push({
        //         productId: product._id,
        //         quantity: item.quantity,
        //         price: item.price,
        //         itemTotal: item.price * item.quantity,
        //     });
        //     vendorOrders[vendorId].subtotal += item.price * item.quantity;
        // }

        //  // Save Vendor Orders
        //  for (const vendorId in vendorOrders) {
        //     const vendorOrder = new VendorOrder(vendorOrders[vendorId]);
        //     await vendorOrder.save();
        // }

         // Mark checkout as processed
        //  checkout.isProcessed = true;
        //  await checkout.save();
        
        
        // await session.commitTransaction();
        // session.endSession();
        
        // Fetch coin settings
        const settings = await CoinSettings.findOne();
        if (!settings) {
            return res.status(400).json({ message: "Coin settings not found" });
        }
        
        let coinsEarned = 0;
        if (checkout.subtotal >= settings.minAmount) {
            coinsEarned = Math.floor((settings.percentage / 100) * checkout.subtotal);
        }
        
        // Update user's coin balance if applicable
        if (coinsEarned > 0) {
            await User.findByIdAndUpdate(userId, { $inc: { coins: coinsEarned } });
        }

        // Delete checkout document and cart 
        await Checkout.findByIdAndDelete(checkoutId);
        await Cart.findByIdAndDelete(checkout.cartId);
        
         return res.status(201).json({
             message: "Order placed successfully",
             order: newOrder,
             coinsEarned
         });
    } catch (error) {
        console.error("Order placement error:", error);

        // await session.abortTransaction();
        // session.endSession();
        // Ensure only one response is sent
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const fetchDeliveryDetails = async (pincode) => {
    try {
        // Fetch pincode details
        const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = response.data;

        if (data[0].Status === "Success" && data[0].PostOffice.length > 0) {
            const state = data[0].PostOffice[0].State.toLowerCase();
            const officeType = data[0].PostOffice[0].BranchType.toLowerCase();

            let daysToAdd;
            if (state === "kerala") {
                // Inside Kerala: Head/Sub office -> 1 day, Branch office -> 2 days
                daysToAdd = (officeType === "head post office" || officeType === "sub post office") ? 1 : 2;
            } else {
                // Outside Kerala: Head/Sub office -> 5 days, Branch office -> 7 days
                daysToAdd = (officeType === "head post office" || officeType === "sub post office") ? 5 : 7;
            }

             const deliveryDate = moment().add(daysToAdd, 'days');

            // Constructing the delivery message
            let deliveryMessage;
            if (daysToAdd === 1) {
                deliveryMessage = "Delivered by tomorrow";
            } else if (daysToAdd === 2) {
                deliveryMessage = "Delivered within 2 days";
            } else {
                deliveryMessage = `Delivered by ${moment(deliveryDate).format("dddd")}, ${moment(deliveryDate).format("MMMM D")}`;
            }

            return { deliveryDate: deliveryDate.format("YYYY-MM-DD"), deliveryMessage };
        } else {
            throw new Error("Invalid Pincode or No Post Office found");
        }
    } catch (error) {
        console.error("Error fetching delivery details:", error.message);
        return null;
    }
};


// get userorders
exports.getUserOrder = async (req, res) => {
    const userId = req.user.id
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const totalOrders = await VendorOrder.countDocuments({ userId });
        // const userOrder = await Order.find(userId).sort({ createdAt: -1 })
         // Fetch vendor-specific orders (each product has its own status)
         const vendorOrders = await VendorOrder.find({userId} )
         .populate("productId")  
         .populate("addressId")
         .populate("orderId", "paymentMethod discountedAmount totalPrice finalPayableAmount")  
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit);
       
         // Format createdAt before sending the response
         const formattedOrders = vendorOrders.map(order => ({
            ...order._doc,  // Spread existing document data
            createdAt: moment(order.createdAt).format("YYYY-MM-DD HH:mm:ss"),
             updatedAt: moment(order.createdAt).format("YYYY-MM-DD HH:mm:ss")
        }));
           // Pagination metadata
           const totalPages = Math.ceil(totalOrders / limit);
           const hasNextPage = page < totalPages;
           const hasPrevPage = page > 1;

        // res.status(200).json({ success: true, vendorOrders: formattedOrders });
        res.status(200).json({
            success: true,
            vendorOrders: formattedOrders,
            pagination: {
                totalOrders,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update cart',
        });
    }
}


exports.getSingleOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await VendorOrder.findById(orderId)
            .populate('productId')
            .populate('addressId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Check for return expiry
        const deliveredDate = moment(order.deliveredAt);
        const returnWithinDays = order.productId.returnWithinDays || 0; // Use the returnWithinDays from the product
        const expiryDate = moment(deliveredDate).add(returnWithinDays, 'days');
        const returnExpired = moment().isAfter(expiryDate);

        // Format createdAt, updatedAt, and add returnExpired before sending response
        const formattedOrder = {
            ...order._doc,  // Spread existing order data
            createdAt: moment(order.createdAt).format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment(order.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
            deliveredAt: moment(order.deliveredAt).format("YYYY-MM-DD HH:mm:ss"),
            returnExpired,  // Add returnExpired field
        };

        res.status(200).json({
            success: true,
            order: formattedOrder,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch order',
        });
    }
};


//for returning the order
exports.requestOrderReturn = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, description } = req.body; // Extract return reason and description
        console.log(reason, description);
        
        const userId = req.user.id; 

        const order = await VendorOrder.findOne({ _id: orderId, userId }).populate("productId");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status !== "Delivered") {
            return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
        }

        if (order.returnStatus === "Returned") {
            return res.status(400).json({ success: false, message: "Order already returned" });
        }

        const product = order.productId;
        if (!product.isReturnable) {
            return res.status(400).json({ success: false, message: "This product is not returnable" });
        }

        let returnDeadline = new Date(order.deliveredAt);
        returnDeadline.setDate(returnDeadline.getDate() + product.returnWithinDays);

        if (new Date() > returnDeadline) {
            return res.status(400).json({ success: false, message: "Return period expired" });
        }
        order.status = "Returned"
        order.returnStatus = "Processing"; // Auto-approved return
        order.cancellationOrReturnReason = reason; // Store return reason
        order.cancellationOrReturnDescription = description || ""; // Store return description (optional)
        order.refundDate = new Date();
        order.refundDate.setDate(order.refundDate.getDate() + 5); // Refund in 5 days

        await order.save();

        res.status(200).json({ success: true, message: "Return initiated. Refund will be processed soon." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error requesting return", error: error.message });
    }
};


exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason, description } = req.body; // Extract reason and description
        console.log(reason, description);

        const userId = req.user.id;

        const order = await VendorOrder.findOne({ _id: orderId, userId }).populate("productId");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === "Delivered") {
            return res.status(400).json({ success: false, message: "Delivered orders cannot be canceled" });
        }

        if (order.status === "Cancelled") {
            return res.status(400).json({ success: false, message: "Order already canceled" });
        }

        order.status = "Cancelled";
        order.cancellationOrReturnReason = reason; // Store the reason for cancellation
        order.cancellationOrReturnDescription = description || ""; // Store description if provided

        // Process refund only if the payment was made (assuming order has a 'paymentStatus' field)
        if (order.paymentStatus === "Paid") {
            order.refundDate = new Date();
            order.refundDate.setDate(order.refundDate.getDate() + Math.floor(Math.random() * 3) + 5); // Refund in 5-7 days
        }

        await order.save();

        res.status(200).json({ 
            success: true, 
            message: "Order canceled successfully. Refund will be processed in 5-7 days if applicable." 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error canceling order", error: error.message });
    }
};

