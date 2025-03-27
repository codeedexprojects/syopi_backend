const mongoose = require("mongoose");
const VendorPayout = require('../Admin/vendorPayout');
const AdminCommission = require('../Admin/CommissionModel');

const VendorOrderSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    itemTotal: { type: Number, required: true },
    discountedPrice: { type: Number, default: 0 },
    couponDiscountedValue: { type: Number, default: 0 },
    color: { type: String, required: true },
    colorName: { type: String, required: true },
    size: { type: String, required: true },
    status: { 
      type: String,  
      enum: {
        values: ['Pending', 'Processing', 'In-Transit', 'Delivered', 'Cancelled', 'Returned'],
        message: 'Invalid order status'
      }, 
      default: "Pending" 
    },
    deliveredAt: { type: Date }, 
    returnStatus: { 
      type: String, 
      enum: ["Not_requested", "Processing", "Returned"], 
      default: "Not_requested" 
    },
    refundDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }  // This ensures 'createdAt' and 'updatedAt' fields are automatically managed
);

// Pre-save hook to manage vendor payout creation and updates
VendorOrderSchema.pre("save", async function (next) {
  try {
    const adminCommissionSettings = await AdminCommission.findOne();
    if (!adminCommissionSettings) {
      return next(new Error("Admin commission settings not found"));
    }

    const vendorId = this.vendorId;
    const orderAmount = this.itemTotal;
    const couponDiscount = this.couponDiscountedValue;
    const adminCommission = (orderAmount * adminCommissionSettings.commissionRate) / 100; 
    const netPayable = orderAmount - adminCommission - couponDiscount;

    // Find an existing pending payout for the vendor
    let vendorPayout = await VendorPayout.findOne({ vendorId, status: "Pending" });

    if (vendorPayout) {
      // If a pending payout exists, update it
      vendorPayout.totalSales += orderAmount;
      vendorPayout.totalCouponDiscounts += couponDiscount;
      vendorPayout.adminCommission += adminCommission;
      vendorPayout.netPayable += netPayable;
      vendorPayout.orderIds.push(this._id);
    } else {
      // If no pending payout exists, create a new one
      vendorPayout = new VendorPayout({
        vendorId,
        totalSales: orderAmount,
        totalCouponDiscounts: couponDiscount,
        adminCommission,
        netPayable,
        orderIds: [this._id],
        status: "Pending"
      });
    }

    // Save the vendor payout record
    await vendorPayout.save();
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("VendorOrder", VendorOrderSchema);
