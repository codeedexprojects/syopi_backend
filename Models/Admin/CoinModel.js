const mongoose = require('mongoose');

const CoinSettingsSchema = new mongoose.Schema({
  coinValue: {
    type: Number,
    default: 0.5,
  },
  minAmount: {
    type: Number,
    default: 100,
  },
  maxOrderDiscountPercent: {
    type: Number,
    default: 5,
  },
  percentage: {
    type: Number,
    default: 4,
  },
  referralCoins: {
    type: Number,
    default: 100,
  },
  referralCoinsUser: {
    type: Number,
    default: 40,
  }
}, { timestamps: true });

module.exports = mongoose.model('CoinSettings', CoinSettingsSchema);
