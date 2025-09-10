const mongoose = require("mongoose");
const VendorPayout = require('../Admin/vendorPayout');
const AdminCommission = require('../Admin/CommissionModel');

const VendorOrderSchema = new mongoose.Schema(
  {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    shippingAddress: {
      name: { type: String, required: true },
      number: { type: String, required: true },
      alternatenumber: { type: Number },
      address: { type: String, required: true },
      landmark: { type: String },
      pincode: { type: Number, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      addressType: { type: String, enum: ['home', 'work'], required: true },
    },
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
        values:
         [ 'Pending', 'Confirmed', 'Processing', 'Shipping', 'In-Transit',
            'Delivered', 'Cancelled','Return_Requested', 'Return_Processing', 'Returned'
          ],
        message: 'Invalid order status'
      }, 
      default: "Pending" 
    },
    deliveryDetails:{
      deliveryDate:{
        type:String
      },
      deliveryMessage:{
        type:String
      }
    },
    deliveredAt: { type: Date }, 
    cancellationOrReturnReason: { type: String, default: "" }, 
    cancellationOrReturnDescription: { type: String, default: "" },  
    refundDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
    coinsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinsAwarded: {
      type: Boolean,
      default: false,
    },
    coinsReversed: {
      type: Boolean,
      default: false,
    },

  },
  { timestamps: true }  // This ensures 'createdAt' and 'updatedAt' fields are automatically managed
);

// Pre-save hook to manage vendor payout creation and updates
VendorOrderSchema.pre("save", async function (next) {
  try {
    if (this.status !== "Delivered") {
      return next();
    }

    const vendor = await mongoose.model("Vendor").findById(this.vendorId);
    if (!vendor || vendor.status !== "approved") {
      return next(); 
    }

    // Get Admin Commission settings
    const adminCommissionSettings = await AdminCommission.findOne();
    if (!adminCommissionSettings) {
      return next(new Error("Admin commission settings not found"));
    }

    const vendorId = this.vendorId;
    const orderAmount = this.itemTotal;
    const couponDiscount = this.couponDiscountedValue;
    const adminCommission = (orderAmount * adminCommissionSettings.commissionRate) / 100;
    const netPayable = orderAmount - adminCommission - couponDiscount;

    let vendorPayout = await VendorPayout.findOne({ vendorId, status: "Pending" });

    if (vendorPayout) {
      vendorPayout.totalSales += orderAmount;
      vendorPayout.totalCouponDiscounts += couponDiscount;
      vendorPayout.adminCommission += adminCommission;
      vendorPayout.netPayable += netPayable;
      vendorPayout.orderIds.push(this._id);
    } else {
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

    await vendorPayout.save();
    next();
  } catch (error) {
    next(error);
  }
});



module.exports = mongoose.model("VendorOrder", VendorOrderSchema);
