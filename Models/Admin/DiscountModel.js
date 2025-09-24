const mongoose = require('mongoose');

const discountSettingsSchema = new mongoose.Schema({
  newUserDiscountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
  },
  newUserDiscountValue: {
    type: Number,
    default: 20, 
  },
}, { timestamps: true });

module.exports = mongoose.model('DiscountSettings', discountSettingsSchema);
