const mongoose = require("mongoose");
const Order = require('../../../Models/User/OrderModel')
const Checkout = require('../../../Models/User/CheckoutModel');
const Product = require('../../../Models/Admin/productModel')
const Cart = require("../../../Models/User/cartModel");
const VendorOrder = require('../../../Models/Vendor/VendorOrderModel')
const CoinSettings = require("../../../Models/Admin/CoinModel");
const User = require('../../../Models/User/UserModel')

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
            const vendorOrder = new VendorOrder({
                vendorId: product.owner.toString(),
                userId,
                orderId: newOrder._id, // Keep reference to the main order
                productId: product._id,  // ✅ Store product directly
                addressId:addressId,
                quantity: item.quantity,
                price: item.price,
                itemTotal: item.price * item.quantity,
                color: item.color,  // ✅ Added color
                size: item.size, 
                status: "Pending",
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

// get userorders
exports.getUserOrder = async (req, res) => {
    const userId = req.user.id
    try {
        // const userOrder = await Order.find(userId).sort({ createdAt: -1 })
         // Fetch vendor-specific orders (each product has its own status)
         const vendorOrders = await VendorOrder.find({userId} )
         .populate("productId")  
         .populate("addressId")   
         .sort({ createdAt: -1 });
        console.log(vendorOrders)
        res.status(200).json({ success: true,vendorOrders });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update cart',
        });
    }
}


// by orderid
exports.getSingleOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await VendorOrder.findById(orderId).populate('productId').populate('addressId');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        res.status(200).json({
           success: true,
            order,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch order',
        });
    }
};
