const mongoose = require('mongoose');

const VendorPayoutSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalSales: { type: Number, default: 0 }, // Total amount before deductions
    totalCoins: { type: Number, default: 0 }, // Coins value given to vendor
    netPayable: { type: Number, default: 0 }, // Final amount total sales+coinamount
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }], // Orders included in the payout
    payoutDate: { type: Date, default: Date.now }, // Midnight calculation timestamp
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' } // Payment status
});

const VendorPayout = mongoose.model('VendorPayout', VendorPayoutSchema);

module.exports = VendorPayout;
