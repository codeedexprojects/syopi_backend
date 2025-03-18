const mongoose = require("mongoose");

const CoinSettingsSchema = new mongoose.Schema({
  percentage: { type: Number, required: true, default: 4 }, // Percentage of order value converted to coins
  minAmount: { type: Number, required: true, default: 100 }, // Min order amount to earn coins
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CoinSettings", CoinSettingsSchema);
