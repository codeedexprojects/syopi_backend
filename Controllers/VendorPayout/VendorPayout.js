const VendorPayout = require('../../Models/Admin/vendorPayout'); // Your Order model
const  Order= require('../../Models/User/OrderModel');

// const calculateDailyVendorPayouts = async () => {
//     try {
//         const todayStart = new Date();
//         todayStart.setHours(0, 0, 0, 0);

//         const todayEnd = new Date();
//         todayEnd.setHours(23, 59, 59, 999);

//         // Fetch today's orders
//         const orders = await Order.find({
//             createdAt: { $gte: todayStart, $lte: todayEnd },
//             paymentStatus: 'Pending'
//         });

//         const vendorEarnings = {};

//         orders.forEach((order) => {
//             order.items.forEach((item) => {
//                 const vendorId = item.vendorId.toString();

//                 if (!vendorEarnings[vendorId]) {
//                     vendorEarnings[vendorId] = {
//                         totalSales: 0,
//                         totalCoinDeductions: 0,
//                         totalCouponDiscounts: 0,
//                         orderIds: []
//                     };
//                 }

//                 vendorEarnings[vendorId].totalSales += item.price * item.quantity;
//                 vendorEarnings[vendorId].totalCoinDeductions += item.coinDiscountedValue || 0;
//                 vendorEarnings[vendorId].totalCouponDiscounts += item.couponDiscountedValue || 0;
//                 vendorEarnings[vendorId].orderIds.push(order._id);
//             });
//         });

//         // Update or create payout records for each vendor
//         for (const [vendorId, data] of Object.entries(vendorEarnings)) {
//             let payout = await VendorPayout.findOne({
//                 vendorId,
//                 status: 'Pending' // Find an existing unpaid payout
//             });

//             if (payout) {
//                 // If unpaid payout exists, update it
//                 payout.totalSales += data.totalSales;
//                 payout.totalCoinDeductions += data.totalCoinDeductions;
//                 payout.totalCouponDiscounts += data.totalCouponDiscounts;
//                 payout.netPayable = payout.totalSales - payout.totalCoinDeductions - payout.totalCouponDiscounts;
//                 payout.orderIds.push(...data.orderIds);
//             } else {
//                 // If no unpaid payout exists, create a new one
//                 payout = new VendorPayout({
//                     vendorId,
//                     totalSales: data.totalSales,
//                     totalCoinDeductions: data.totalCoinDeductions,
//                     totalCouponDiscounts: data.totalCouponDiscounts,
//                     netPayable: data.totalSales - data.totalCoinDeductions - data.totalCouponDiscounts,
//                     orderIds: data.orderIds
//                 });
//             }

//             await payout.save();
//         }

//         console.log('✅ Daily vendor payouts calculated successfully.');
//     } catch (error) {
//         console.error('❌ Error calculating vendor payouts:', error);
//     }
// };

// // Run this function manually or set it as a cron job
// module.exports = calculateDailyVendorPayouts;

exports.getAllVendorPayouts = async (req, res) => {
    try {
        const payouts = await VendorPayout.find().populate('vendorId', 'name email'); // Fetch all payouts with vendor details

        res.status(200).json({ success: true, payouts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payouts', error: error.message });
    }
};

exports.getVendorPayoutsByVendorId = async (req, res) => {
    try {
        const { vendorId } = req.params; // Extract vendorId from URL

        const payouts = await VendorPayout.find({ vendorId });

        if (!payouts.length) {
            return res.status(404).json({ success: false, message: 'No payouts found for this vendor' });
        }

        res.status(200).json({ success: true, payouts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching payouts', error: error.message });
    }
};

exports.updateVendorPayoutStatus = async (req, res) => {
    try {
        const { payoutId } = req.params; // Payout ID from URL
        const { status } = req.body; // New status from request body

        if (!['pending', 'paid'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const payout = await Payout.findByIdAndUpdate(
            payoutId,
            { status },
            { new: true }
        );

        if (!payout) {
            return res.status(404).json({ success: false, message: 'Payout not found' });
        }

        res.status(200).json({ success: true, message: 'Payout status updated', payout });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating payout status', error: error.message });
    }
};
