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

  if (!checkoutId || !addressId || !userId || !paymentMethod) {
    return res.status(400).json({
      message: "Missing required fields: checkoutId, addressId, paymentMethod, or user authentication"
    });
  }

  try {
    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (checkout.isProcessed) {
      return res.status(400).json({ message: "Checkout has already been processed" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const shippingAddress = {
    name: address.name,
    number: address.number,
    alternatenumber: address.alternatenumber,
    address: address.address,
    landmark: address.landmark,
    pincode: address.pincode,
    city: address.city,
    state: address.state,
    addressType: address.addressType,
    };

    const deliveryDetails = await fetchDeliveryDetails(address.pincode);
    if (!deliveryDetails) {
      return res.status(400).json({
        success: false,
        message: "Failed to calculate delivery date",
      });
    }

    const settings = await CoinSettings.findOne();

    // ✅ Create the parent Order ONCE
    const newOrder = new Order({
      userId,
      shippingAddress,
      checkoutId,
      deliveryCharge,
      paymentMethod,
      coinsEarned: 0 // will be updated later if needed
    });
    await newOrder.save();

    let totalCoinsEarned = 0;

    for (const item of checkout.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.variants.find(v => v.color === item.color);
      if (!variant) continue;

      const sizeData = variant.sizes.find(s => s.size === item.size);
      if (!sizeData) continue;

      if (sizeData.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name} (${item.color} - ${item.size})`
        });
      }

      // Update inventory
      sizeData.stock -= item.quantity;
      sizeData.salesCount += item.quantity;
      variant.salesCount += item.quantity;
      product.totalSales += item.quantity;
      product.totalStock = product.variants.reduce((sum, v) =>
        sum + v.sizes.reduce((sizeSum, s) => sizeSum + s.stock, 0), 0);

      await product.save();

      // ✅ Calculate coins for this item
      let coinsEarned = 0;
      if (settings && checkout.subtotal >= settings.minAmount) {
        coinsEarned = Math.floor((settings.percentage / 100) * item.price * item.quantity);
        totalCoinsEarned += coinsEarned;
      }

      // ✅ Create vendor-specific order
      const vendorOrder = new VendorOrder({
        vendorId: product.owner.toString(),
        userId,
        orderId: newOrder._id,
        productId: product._id,
        shippingAddress,
        quantity: item.quantity,
        price: item.price,
        itemTotal: item.price * item.quantity,
        discountedPrice: item.DiscountedPrice,
        couponDiscountedValue: item.couponDiscountedValue,
        color: item.color,
        colorName: item.colorName,
        size: item.size,
        deliveryDetails,
        status: "Pending",
        coinsEarned
      });

      await vendorOrder.save();
    }

    // ✅ Update coinsEarned in the main order (after loop)
    newOrder.coinsEarned = totalCoinsEarned;
    await newOrder.save();

    // ✅ Clean up checkout and cart
    await Checkout.findByIdAndDelete(checkoutId);
    await Cart.findByIdAndDelete(checkout.cartId);

    return res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });

  } catch (error) {
    console.error("Order placement error:", error);
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
  const userId = req.user.id;
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ userId });

    const orders = await Order.find({ userId })
      .populate("products.productId", "name images")
      .populate("addressId")
      .populate("coupon", "code discountType discountValue")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = orders.map(order => ({
      ...order._doc,
      createdAt: moment(order.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(order.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user orders",
    });
  }
};


exports.getSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // Only fetch orders of the logged-in user

    const order = await Order.findOne({ _id: orderId, userId })
      .populate("products.productId", "name images returnWithinDays description") // populate product info
      .populate("addressId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Optional: Determine return expiry based on first product
    let returnExpired = false;
    let expiryDateFormatted = null;

    const deliveredAt = order.deliveredAt;
    const firstProduct = order.products?.[0]?.productId;

    if (deliveredAt && firstProduct?.returnWithinDays) {
      const expiryDate = moment(deliveredAt).add(firstProduct.returnWithinDays, "days");
      returnExpired = moment().isAfter(expiryDate);
      expiryDateFormatted = expiryDate.format("YYYY-MM-DD");
    }

    const formattedOrder = {
      ...order._doc,
      createdAt: moment(order.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(order.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
      deliveredAt: order.deliveredAt
        ? moment(order.deliveredAt).format("YYYY-MM-DD HH:mm:ss")
        : null,
      returnExpired,
      returnExpiryDate: expiryDateFormatted,
    };

    res.status(200).json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("Error fetching user order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order",
    });
  }
};


//for returning the order
exports.requestOrderReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    // Step 1: Find VendorOrder for the user and orderId
    const vendorOrder = await VendorOrder.findOne({ _id: orderId, userId }).populate("productId");

    if (!vendorOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (vendorOrder.status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }

    // Check if already returned or in process
    if (["Return_Requested", "Return_Processing", "Returned"].includes(vendorOrder.status)) {
      return res.status(400).json({ success: false, message: "Return already requested or completed" });
    }

    const product = vendorOrder.productId;

    if (!product.isReturnable) {
      return res.status(400).json({ success: false, message: "This product is not returnable" });
    }

    const returnWithinDays = product.returnWithinDays || 0;
    const returnDeadline = moment(vendorOrder.deliveredAt).add(returnWithinDays, "days");

    if (moment().isAfter(returnDeadline)) {
      return res.status(400).json({ success: false, message: "Return period expired" });
    }

    // Step 2: Update VendorOrder
    vendorOrder.status = "Return_Requested";
    vendorOrder.cancellationOrReturnReason = reason;
    vendorOrder.cancellationOrReturnDescription = description || "";
    await vendorOrder.save();

    // Step 3: Update main Order status if needed
    await Order.findByIdAndUpdate(
      vendorOrder.orderId,
      {
        status: "Return_Requested",
        cancellationOrReturnReason: reason,
        cancellationOrReturnDescription: description || ""
      }
    );

    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully. Vendor will process it shortly."
    });

  } catch (error) {
    console.error("Return request error:", error);
    return res.status(500).json({
      success: false,
      message: "Error requesting return",
      error: error.message
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params; // VendorOrder _id
    const { reason, description } = req.body;
    const userId = req.user.id;

    // Step 1: Find vendor order by _id and userId
    const vendorOrder = await VendorOrder.findOne({ _id: orderId, userId }).populate("productId");

    if (!vendorOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (vendorOrder.status === "Delivered") {
      return res.status(400).json({ success: false, message: "Delivered orders cannot be canceled" });
    }

    if (vendorOrder.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order already canceled" });
    }

    // Step 2: Cancel the vendor order
    vendorOrder.status = "Cancelled";
    vendorOrder.cancellationOrReturnReason = reason;
    vendorOrder.cancellationOrReturnDescription = description || "";

    // Refund if already paid
    if (vendorOrder.paymentStatus === "Paid") {
      const refundDays = Math.floor(Math.random() * 3) + 5; // 5-7 days
      vendorOrder.refundDate = new Date(Date.now() + refundDays * 24 * 60 * 60 * 1000);
    }

    // Step 3: Reverse coins if awarded
    if (vendorOrder.coinsAwarded && !vendorOrder.coinsReversed && vendorOrder.coinsEarned > 0) {
      await User.findByIdAndUpdate(vendorOrder.userId, {
        $inc: { coins: -vendorOrder.coinsEarned }
      });
      vendorOrder.coinsReversed = true;
    }

    await vendorOrder.save();

    // Step 4: Update main Order model too
    await Order.findByIdAndUpdate(
      vendorOrder.orderId,
      {
        status: "Cancelled",
        cancellationOrReturnReason: reason,
        cancellationOrReturnDescription: description || ""
      }
    );

    return res.status(200).json({
      success: true,
      message: "Order canceled successfully. Refund will be processed in 5-7 days if applicable.",
    });

  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ success: false, message: "Error canceling order", error: error.message });
  }
};



