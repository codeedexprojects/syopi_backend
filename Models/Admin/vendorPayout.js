const mongoose = require('mongoose');

const VendorPayoutSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    totalSales: { type: Number, default: 0 }, // Total amount before deductions
    totalCouponDiscounts: { type: Number, default: 0 }, // Coupon discounts (proportional)
    adminCommission: { type: Number, default: 0 }, // Commission deducted by admin
    netPayable: { type: Number, default: 0 }, // Final amount payable to vendor
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VendorOrder' }], // Orders included in the payout
    payoutDate: { type: Date, default: Date.now }, // Timestamp of payout calculation
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' } // Payment status
});

const VendorPayout = mongoose.model('VendorPayout', VendorPayoutSchema);
module.exports = VendorPayout;

