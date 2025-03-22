const mongoose = require('mongoose');

const commissionSettingsSchema = new mongoose.Schema({
    commissionRate: { type: Number, default: 10 } // Default 10% commission
});

const commissionSettings = mongoose.model('CommissionSettings', commissionSettingsSchema);
module.exports = commissionSettings;
