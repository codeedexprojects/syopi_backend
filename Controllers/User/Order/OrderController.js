const mongoose = require("mongoose");
const Order = require("../../../Models/User/OrderModel");
const Checkout = require("../../../Models/User/CheckoutModel");
const Product = require("../../../Models/Admin/productModel");
const Cart = require("../../../Models/User/cartModel");
const Address = require("../../../Models/User/AddressModel");
const VendorOrder = require("../../../Models/Vendor/VendorOrderModel");
const CoinSettings = require("../../../Models/Admin/CoinModel");
const User = require("../../../Models/User/UserModel");
const moment = require("moment");
const axios = require("axios");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

// place order
exports.placeOrder = async (req, res) => {
  const { checkoutId, addressId, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!checkoutId || !addressId || !userId || !paymentMethod) {
    return res.status(400).json({
      message:
        "Missing required fields: checkoutId, addressId, paymentMethod, or user authentication",
    });
  }

  try {
    const checkout = await Checkout.findById(checkoutId);
    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (checkout.isProcessed) {
      return res
        .status(400)
        .json({ message: "Checkout has already been processed" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
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

    // ✅ Create the parent Order once
    const newOrder = new Order({
      userId,
      shippingAddress,
      checkoutId,
      deliveryCharge: checkout.deliveryCharge,
      paymentMethod,
      coinsEarned: 0,
    });
    await newOrder.save();

    // ✅ Update inventory for each item and create vendor orders
    let deliveryChargeAssigned = false;

    for (const item of checkout.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.variants.find((v) => v.color === item.color);
      if (!variant) continue;

      const sizeData = variant.sizes.find((s) => s.size === item.size);
      if (!sizeData) continue;

      if (sizeData.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name} (${item.color} - ${item.size})`,
        });
      }

      // ✅ Update inventory
      sizeData.stock -= item.quantity;
      sizeData.salesCount += item.quantity;
      variant.salesCount += item.quantity;
      product.totalSales += item.quantity;
      product.totalStock = product.variants.reduce(
        (sum, v) => sum + v.sizes.reduce((sizeSum, s) => sizeSum + s.stock, 0),
        0
      );

      await product.save();

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
        coinsEarned: 0, // placeholder
        deliveryCharge: !deliveryChargeAssigned ? checkout.deliveryCharge : 0, // ✅ only first vendor order
      });

      deliveryChargeAssigned = true; // ✅ after first assignment

      await vendorOrder.save();
    }

    // ✅ Calculate coins earned based on subtotal
    let totalCoinsEarned = 0;
    if (settings && checkout.subtotal >= settings.minAmount) {
      totalCoinsEarned = Math.floor(
        (checkout.subtotal * settings.percentage) / 100 / settings.coinValue
      );
    }
    newOrder.coinsEarned = totalCoinsEarned;
    await newOrder.save();

    // ✅ Deduct coins after placing the order
    if (checkout.coinsApplied && checkout.coinsApplied > 0) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error("User not found when deducting coins.");
        }

        if (user.coins < checkout.coinsApplied) {
          throw new Error("Insufficient coins to apply.");
        }

        await user.spendCoins(
          checkout.coinsApplied,
          newOrder._id,
          "Order",
          "Coins applied to order discount"
        );

        newOrder.coinsApplied = checkout.coinsApplied;
        newOrder.discountFromCoins = checkout.discountFromCoins;
        await newOrder.save();

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Coin deduction failed:", error);
        return res.status(500).json({
          message: "Failed to apply coins to order.",
          error: error.message,
        });
      }
    }

    // ✅ Mark checkout as processed and cleanup
    checkout.isProcessed = true;
    await checkout.save();
    await Checkout.findByIdAndDelete(checkoutId);
    await Cart.findByIdAndDelete(checkout.cartId);

    return res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Order placement error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


const fetchDeliveryDetails = async (pincode) => {
  try {
    const options = {
      method: "POST",
      url: "https://pincode.p.rapidapi.com/v1/postalcodes/india",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "pincode.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: { search: pincode },
    };

    const response = await axios.request(options);
    const data = response.data;

    // ✅ API returns an array, not { postalCodes: [] }
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid Pincode or No Post Office found");
    }

    // Pick the first office (you could enhance later to prefer S.O/H.O)
    const postOffice = data[0];
    const state = (postOffice.state || "").toLowerCase();
    const officeType = (postOffice.office_type || "").toLowerCase();

    // ✅ Delivery calculation logic
    let daysToAdd;
    if (state === "kerala") {
      daysToAdd = 2; // Always minimum 2 days inside Kerala
    } else {
      daysToAdd =
        officeType.includes("s.o") || officeType.includes("h.o") ? 5 : 7;
    }

    // ✅ Safeguard: enforce minimum 2 days
    if (daysToAdd < 2) daysToAdd = 2;

    const deliveryDate = moment().add(daysToAdd, "days");
    let deliveryMessage =
      daysToAdd === 2
        ? "Delivered within 2 days"
        : `Delivered by ${deliveryDate.format("dddd")}, ${deliveryDate.format(
            "MMMM D"
          )}`;

    return {
      success: true,
      deliveryDate: deliveryDate.format("YYYY-MM-DD"),
      deliveryMessage,
      pincode,
    };
  } catch (error) {
    console.error("Error fetching delivery details:", error.message);
    return { success: false, message: "Error fetching delivery details" };
  }
};

// get userorders
exports.getUserOrder = async (req, res) => {
  const userId = req.user.id;
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const totalOrders = await VendorOrder.countDocuments({ userId });

    const orders = await VendorOrder.find({ userId })
      .populate("productId", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = orders.map((order) => ({
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
      },
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
    const userId = req.user.id;

    // Fetch the single vendor order by orderId and userId
    const vendorOrder = await VendorOrder.findOne({ _id: orderId, userId })
      .populate("productId", "name images returnWithinDays description")
      .lean();

    if (!vendorOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Extract shipping address and product details
    const shippingAddress = vendorOrder.shippingAddress;
    const deliveredAt = vendorOrder.deliveredAt || null;
    const firstProduct = vendorOrder.productId || null;

    let returnExpired = false;
    let returnExpiryDate = null;

    if (deliveredAt && firstProduct?.returnWithinDays) {
      const expiryDate = moment(deliveredAt).add(
        firstProduct.returnWithinDays,
        "days"
      );
      returnExpired = moment().isAfter(expiryDate);
      returnExpiryDate = expiryDate.format("YYYY-MM-DD");
    }

    // Build the products array (with one product in this case)
    const products = [
      {
        _id: vendorOrder._id,
        productId: vendorOrder.productId,
        quantity: vendorOrder.quantity,
        price: vendorOrder.price,
        color: vendorOrder.color,
        size: vendorOrder.size,
        deliveryDetails: vendorOrder.deliveryDetails || null,
        deliveryStatus: vendorOrder.status,
      },
    ];

    // Aggregate fields
    const totalPrice = vendorOrder.price * vendorOrder.quantity;
    const discountedAmount = vendorOrder.discountedPrice || 0;
    const coinsEarned = vendorOrder.coinsEarned || 0;

    const formattedOrder = {
      shippingAddress,
      _id: vendorOrder._id,
      userId: vendorOrder.userId,
      checkoutId: vendorOrder.orderId, // Assuming this is set properly
      deliveryCharge: 0, // Set if applicable
      paymentMethod: vendorOrder.paymentMethod || "Cash on Delivery",
      status: vendorOrder.status,
      discountedAmount,
      cancellationOrReturnReason: vendorOrder.cancellationOrReturnReason || "",
      cancellationOrReturnDescription:
        vendorOrder.cancellationOrReturnDescription || "",
      coinsEarned,
      products,
      createdAt: moment(vendorOrder.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: moment(vendorOrder.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
      totalPrice,
      finalPayableAmount: totalPrice - discountedAmount,
      coupon: null, // Set if applicable
      __v: vendorOrder.__v || 0,
      deliveredAt: deliveredAt
        ? moment(deliveredAt).format("YYYY-MM-DD HH:mm:ss")
        : null,
      returnExpired,
      returnExpiryDate,
    };

    return res.status(200).json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("Error fetching user order:", error);
    return res.status(500).json({
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
    const vendorOrder = await VendorOrder.findOne({
      _id: orderId,
      userId,
    }).populate("productId");

    if (!vendorOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (vendorOrder.status !== "Delivered") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only delivered orders can be returned",
        });
    }

    // Check if already returned or in process
    if (
      ["Return_Requested", "Return_Processing", "Returned"].includes(
        vendorOrder.status
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Return already requested or completed",
        });
    }

    const product = vendorOrder.productId;

    if (!product.isReturnable) {
      return res
        .status(400)
        .json({ success: false, message: "This product is not returnable" });
    }

    const returnWithinDays = product.returnWithinDays || 0;
    const returnDeadline = moment(vendorOrder.deliveredAt).add(
      returnWithinDays,
      "days"
    );

    if (moment().isAfter(returnDeadline)) {
      return res
        .status(400)
        .json({ success: false, message: "Return period expired" });
    }

    // Step 2: Update VendorOrder
    vendorOrder.status = "Return_Requested";
    vendorOrder.cancellationOrReturnReason = reason;
    vendorOrder.cancellationOrReturnDescription = description || "";
    await vendorOrder.save();

    // Step 3: Update main Order status if needed
    await Order.findByIdAndUpdate(vendorOrder.orderId, {
      status: "Return_Requested",
      cancellationOrReturnReason: reason,
      cancellationOrReturnDescription: description || "",
    });

    return res.status(200).json({
      success: true,
      message:
        "Return request submitted successfully. Vendor will process it shortly.",
    });
  } catch (error) {
    console.error("Return request error:", error);
    return res.status(500).json({
      success: false,
      message: "Error requesting return",
      error: error.message,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params; // VendorOrder _id
    const { reason, description } = req.body;
    const userId = req.user.id;

    // Step 1: Find vendor order by _id and userId
    const vendorOrder = await VendorOrder.findOne({
      _id: orderId,
      userId,
    }).populate("productId");
    if (!vendorOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (vendorOrder.status === "Delivered") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Delivered orders cannot be cancelled",
        });
    }

    if (vendorOrder.status === "Cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Order already canceled" });
    }

    // Step 2: Cancel the vendor order
    vendorOrder.status = "Cancelled";
    vendorOrder.cancellationOrReturnReason = reason;
    vendorOrder.cancellationOrReturnDescription = description || "";

    // Refund if already paid
    if (vendorOrder.paymentStatus === "Paid") {
      const refundDays = Math.floor(Math.random() * 3) + 5; // 5-7 days
      vendorOrder.refundDate = new Date(
        Date.now() + refundDays * 24 * 60 * 60 * 1000
      );
    }

    // Step 3: Reverse coins if awarded
    if (
      vendorOrder.coinsAwarded &&
      !vendorOrder.coinsReversed &&
      vendorOrder.coinsEarned > 0
    ) {
      await User.findByIdAndUpdate(vendorOrder.userId, {
        $inc: { coins: -vendorOrder.coinsEarned },
      });
      vendorOrder.coinsReversed = true;
    }

    await vendorOrder.save();

    // Step 4: Update main Order model
    const mainOrder = await Order.findByIdAndUpdate(
      vendorOrder.orderId,
      {
        status: "Cancelled",
        cancellationOrReturnReason: reason,
        cancellationOrReturnDescription: description || "",
      },
      { new: true }
    );

    if (!mainOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Main order not found" });
    }

    // Step 5: Update Product stock and sales at both levels
    for (const item of mainOrder.products) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      // Update total stock and sales
      product.totalStock += item.quantity;
      product.totalSales -= item.quantity;

      // Find the correct variant by color and price (or another identifier)
      const variant = product.variants.find(
        (v) => v.color === item.color && v.price === item.price
      );

      if (variant) {
        variant.salesCount -= item.quantity;

        // Find the correct size within the variant
        const sizeObj = variant.sizes.find((s) => s.size === item.size);
        if (sizeObj) {
          sizeObj.stock += item.quantity;
          sizeObj.salesCount -= item.quantity;
        }
      }

      await product.save();
    }

    return res.status(200).json({
      success: true,
      message:
        "Order canceled successfully. Refund will be processed in 5-7 days if applicable.",
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error canceling order",
        error: error.message,
      });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await VendorOrder.findById(orderId)
      .populate("productId", "name subtitle")
      .populate(
        "vendorId",
        "businessname businesslandmark businesslocation email address city pincode"
      )
      .populate("userId", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const fonts = {
      Roboto: {
        normal: path.join(__dirname, "../../../fonts/Roboto-Regular.ttf"),
        bold: path.join(__dirname, "../../../fonts/Roboto-Bold.ttf"),
        italics: path.join(__dirname, "../../../fonts/Roboto-Italic.ttf"),
        bolditalics: path.join(__dirname, "../../../fonts/Roboto-BoldItalic.ttf"),
      },
    };

    const printer = new PdfPrinter(fonts);

    // Logo configuration
    const logoPath = path.join(__dirname, "../../../Assets/logo.png");
    const logoExists = fs.existsSync(logoPath);
    let logoBase64 = null;

    if (logoExists) {
      logoBase64 = fs.readFileSync(logoPath).toString("base64");
    }

    const docDefinition = {
      content: [
        // Header Section with Logo and Invoice Info
        {
          columns: [
            {
              width: "50%",
              stack: logoExists
                ? [
                    {
                      image: `data:image/png;base64,${logoBase64}`,
                      width: 60,
                      height: 60,
                      margin: [0, 0, 0, 10],
                    },
                  ]
                : [{ text: "Syopi", style: "logoText" }],
            },
            {
              width: "50%",
              stack: [
                { text: "INVOICE", style: "invoiceTitle", alignment: "right" },
                {
                  text: `Issued ${new Date(order.createdAt).toLocaleDateString(
                    "en-GB"
                  )}`,
                  style: "issueDate",
                  alignment: "right",
                },
              ],
            },
          ],
          margin: [0, 0, 0, 30],
        },

        // FROM and BILL TO Section
        {
          columns: [
            {
              width: "50%",
              stack: [
                { text: "FROM", style: "sectionLabel" },
                {
                  text: order.vendorId?.businessname || "Syopi",
                  style: "companyName",
                },
                {
                  text: order.vendorId?.email || "syopi5051@gmail.com",
                  style: "contactText",
                },
                {
                  text: order.vendorId?.businesslandmark || "KK Building",
                  style: "addressText",
                },
                {
                  text: order.vendorId?.businesslocation || "Moonadi",
                  style: "addressText",
                },
                {
                  text: order.vendorId?.address || "Veliyanchery",
                  style: "addressText",
                },
                {
                  text: order.vendorId?.city || "Malappuram",
                  style: "addressText",
                },
                {
                  text: order.vendorId?.pincode || "679326",
                  style: "addressText",
                },
              ],
            },
            {
              width: "50%",
              stack: [
                { text: "BILL TO", style: "sectionLabel", alignment: "right" },
                {
                  text:
                    order.shippingAddress?.name ||
                    order.userId?.name ||
                    "Musthafa",
                  style: "customerName",
                  alignment: "right",
                },
                {
                  text: order.shippingAddress?.number || "123456789",
                  style: "contactText",
                  alignment: "right",
                },
                {
                  text: order.userId?.email || "Misthafa@gmail.com",
                  style: "contactText",
                  alignment: "right",
                },
                {
                  text: order.shippingAddress?.address || "Jijiji",
                  style: "addressText",
                  alignment: "right",
                },
                ...(order.shippingAddress
                  ? [
                      order.shippingAddress.city
                        ? {
                            text: order.shippingAddress.city,
                            style: "addressText",
                            alignment: "right",
                          }
                        : null,
                      order.shippingAddress.state
                        ? {
                            text: order.shippingAddress.state,
                            style: "addressText",
                            alignment: "right",
                          }
                        : null,
                      order.shippingAddress.pincode
                        ? {
                            text: order.shippingAddress.pincode,
                            style: "addressText",
                            alignment: "right",
                          }
                        : null,
                    ].filter(Boolean)
                  : []),
              ],
            },
          ],
          margin: [0, 0, 0, 30],
        },

        // Table Section
        {
          table: {
            headerRows: 1,
            widths: ["*", "15%", "20%", "20%"],
            body: [
              // Header Row
              [
                {
                  text: "Description",
                  style: "tableHeader",
                  border: [false, false, false, true],
                },
                {
                  text: "QTY",
                  style: "tableHeader",
                  alignment: "center",
                  border: [false, false, false, true],
                },
                {
                  text: "Price, INR",
                  style: "tableHeader",
                  alignment: "right",
                  border: [false, false, false, true],
                },
                {
                  text: "Amount, INR",
                  style: "tableHeader",
                  alignment: "right",
                  border: [false, false, false, true],
                },
              ],
              // Product Row
              [
                {
                  text: order.productId?.name || "Shirt",
                  style: "productText",
                  border: [false, false, false, false],
                  margin: [0, 10, 0, 10],
                },
                {
                  text: order.quantity.toString() || "1",
                  style: "productText",
                  alignment: "center",
                  border: [false, false, false, false],
                  margin: [0, 10, 0, 10],
                },
                {
                  text: `${order.price?.toFixed(2) || "2.00"}`,
                  style: "productText",
                  alignment: "right",
                  border: [false, false, false, false],
                  margin: [0, 10, 0, 10],
                },
                {
                  text: `${order.itemTotal?.toFixed(2) || "2.00"}`,
                  style: "productText",
                  alignment: "right",
                  border: [false, false, false, false],
                  margin: [0, 10, 0, 10],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 1 ? 1 : 0; // Only line after header
            },
            vLineWidth: function (i, node) {
              return 0; // No vertical lines
            },
            hLineColor: function (i, node) {
              return "#CCCCCC";
            },
            paddingLeft: function (i, node) {
              return 0;
            },
            paddingRight: function (i, node) {
              return 0;
            },
            paddingTop: function (i, node) {
              return i === 0 ? 8 : 0;
            },
            paddingBottom: function (i, node) {
              return i === 0 ? 8 : 0;
            },
          },
          margin: [0, 0, 0, 20],
        },

        // Total Section
        // Total Section
        {
          columns: [
            {
              width: "*",
              text: "",
            },
            {
              width: "40%",
              stack: [
                {
                  columns: [
                    { width: "*", text: "Total", style: "totalLabel" },
                    {
                      width: "auto",
                      text: `₹  ${order.itemTotal?.toFixed(2) || "2.00"}`,
                      style: "totalAmount",
                    },
                  ],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 40],
        },
      ],

      styles: {
        logoText: {
          fontSize: 18,
          bold: true,
          color: "#2563eb",
        },
        invoiceTitle: {
          fontSize: 28,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        invoiceNumber: {
          fontSize: 14,
          color: "#666666",
          margin: [0, 0, 0, 2],
        },
        issueDate: {
          fontSize: 12,
          color: "#666666",
          margin: [0, 0, 0, 0],
        },
        sectionLabel: {
          fontSize: 10,
          bold: true,
          margin: [0, 0, 0, 8],
          color: "#666666",
        },
        companyName: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 4],
          color: "#000000",
        },
        customerName: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 4],
          color: "#000000",
        },
        contactText: {
          fontSize: 12,
          margin: [0, 0, 0, 2],
          color: "#666666",
        },
        addressText: {
          fontSize: 12,
          margin: [0, 0, 0, 2],
          color: "#666666",
        },
        tableHeader: {
          fontSize: 12,
          bold: true,
          color: "#000000",
          margin: [0, 5, 0, 5],
        },
        productText: {
          fontSize: 13,
          color: "#000000",
        },
        totalLabel: {
          fontSize: 14,
          bold: true,
          color: "#000000",
        },
        totalAmount: {
          fontSize: 14,
          bold: true,
          color: "#000000",
          alignment: "right",
        },
        footerText: {
          fontSize: 10,
          color: "#999999",
        },
      },

      defaultStyle: {
        font: "Roboto",
        lineHeight: 1,
      },

      pageMargins: [40, 40, 40, 40],
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const result = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice_${orderId}.pdf`
      );
      res.send(result);
    });

    pdfDoc.end();
  } catch (err) {
    console.error("Invoice generation failed:", err);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};
