const cron = require('node-cron');
const Coupon = require('../Models/Admin/couponModel');
const calculateDailyVendorPayouts = require('../Controllers/VendorPayout/VendorPayout').calculateDailyVendorPayouts;


// Function to check and update coupon statuses
const updateCouponStatuses = async () => {
  console.log('Running coupon expiration check...');
  const now = new Date();

  try {
    const result = await Coupon.updateMany(
      { endDate: { $lt: now }, status: 'active' }, // Expired but still marked active
      { $set: { status: 'expired' } }
    );
    console.log(`Updated ${result.modifiedCount} coupons to 'expired' status.`);
  } catch (error) {
    console.error('Error updating coupon statuses:', error.message);
  }
};

// function to calculate vendor venndor payments
const processVendorPayouts = async () => {
  console.log('🔄 Running daily vendor payout calculation...');
  try {
    await calculateDailyVendorPayouts();
    console.log('✅ Vendor payout calculation completed.');
  } catch (error) {
    console.error('❌ Error calculating vendor payouts:', error.message);
  }
};

// Schedule the job and export it
const scheduleCouponCron = () => {
  cron.schedule('0 0 * * *', updateCouponStatuses, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // You can adjust the timezone if necessary
  });
};

const schedulePayoutCron = () => {
  cron.schedule('0 0 * * *', processVendorPayouts, {
    scheduled: true,
    timezone: 'Asia/Kolkata', // You can adjust the timezone if necessary
  });
};

module.exports = { scheduleCouponCron, updateCouponStatuses ,schedulePayoutCron,processVendorPayouts};
 