const mongoose = require("mongoose");

const coinSettingsSchema = new mongoose.Schema({
  percentage: { type: Number, default: 0 }, // Coin percentage (e.g., for cashback)
  minAmount: { type: Number, default: 0 }, // Minimum amount for earning coins
  referralCoins: { type: Number, default: 50 }, // Default referral coin amount
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CoinSettings", coinSettingsSchema);
