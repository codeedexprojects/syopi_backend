const mongoose = require('mongoose');

const CoinSettingsSchema = new mongoose.Schema({
  coinValue: {
    type: Number,
    default: 0.5,  // 1 coin = ₹0.5
  },
  minAmount: {
    type: Number,
    default: 100,  // Minimum order value to earn coins
  },
  maxOrderDiscountPercent: {
    type: Number,
    default: 5, // Max discount allowed per order in percent
  },
  percentage: {
    type: Number,
    default: 4,  // % of order total converted to coins
  },
  referralCoins: {
    type: Number,
    default: 50, // 👈 Amount of coins given for a successful referral
  }
}, { timestamps: true });

module.exports = mongoose.model('CoinSettings', CoinSettingsSchema);
